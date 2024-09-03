import { getComponent, UUIDComponent } from "../../ecs";
import {
    checkBitflag,
    createViewCursor,
    readUint32,
    readUint8,
    rewindViewCursor,
    sliceViewCursor,
    spaceUint32,
    spaceUint8,
} from "../../network";

const writeEntity = (v, entityID, entity, serializationSchema) => {
    const rewind = rewindViewCursor(v);

    const writeEntityID = spaceUint32(v);

    const writeChangeMask = spaceUint8(v);
    let changeMask = 0;
    let b = 0;

    for (const component of serializationSchema) {
        changeMask |= component.write(v, entity) ? 1 << b++ : b++ && 0;
    }

    if (changeMask > 0) {
        writeEntityID(entityID);
        return writeChangeMask(changeMask);
    }

    return rewind();
};

const createSerializer = ({ entities, schema, chunkLength, onCommitChunk }) => {
    let data = {
        startTimecode: Date.now(),
        entities: [],
        changes: [],
    };

    const view = createViewCursor(new ArrayBuffer(10000));

    let frame = 0;
    let chunk = 0;

    const write = () => {
        const writeCount = spaceUint32(view);

        let count = 0;
        for (const entity of entities()) {
            const uuid = getComponent(entity, UUIDComponent);
            if (!data.entities.includes(uuid)) {
                data.entities.push(uuid);
            }

            const entityIndex = data.entities.indexOf(uuid);

            count += writeEntity(view, entityIndex, entity, schema) ? 1 : 0;
        }

        if (count > 0) writeCount(count);
        else view.cursor = 0; // nothing written

        const buffer = sliceViewCursor(view);

        data.changes.push(buffer);

        frame++;

        if (frame > chunkLength) {
            commitChunk();
        }
    };

    const commitChunk = () => {
        frame = 0;

        onCommitChunk(data, chunk++);

        data = {
            startTimecode: Date.now(),
            entities: [],
            changes: [],
        };
    };

    const end = () => {
        ActiveSerializers.delete(serializer);
        commitChunk();
    };

    const serializer = { write, commitChunk, end };

    ActiveSerializers.add(serializer);

    return serializer;
};

export const ActiveSerializers = new Set();

export const readEntity = (v, entities, serializationSchema) => {
    const entityIndex = readUint32(v);
    const changeMask = readUint8(v);

    const entity = UUIDComponent.getEntityByUUID(entities[entityIndex]);

    let b = 0;

    for (const component of serializationSchema) {
        if (checkBitflag(changeMask, 1 << b++)) {
            component.read(v, entity);
        }
    }
};

export const readEntities = (v, byteLength, entities, schema) => {
    while (v.cursor < byteLength) {
        const count = readUint32(v);
        for (let i = 0; i < count; i++) {
            readEntity(v, entities, schema);
        }
    }
};

const toArrayBuffer = buf => {
    const ab = new ArrayBuffer(buf.length);
    const view = new Uint8Array(ab);
    for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
    }
    return ab;
};

export const createDeserializer = ({ id, chunks, schema, onChunkStarted, onEnd }) => {
    onChunkStarted(0);

    const read = (chunk, frame) => {
        const data = chunks[chunk];
        const frameData = toArrayBuffer(data.changes[frame]);

        if (frameData) {
            const view = createViewCursor(frameData);
            readEntities(view, frameData.byteLength, data.entities, schema);
        }

        if (frame >= data.changes.length) {
            onChunkStarted(chunk);
            if (chunk >= chunks.length) {
                end();
                onEnd();
            }
        }
    };

    const end = () => {
        ActiveDeserializers.delete(id);
    };

    const deserializer = { read, end };

    ActiveDeserializers.set(id, deserializer);

    return deserializer;
};

export const ActiveDeserializers = new Map();

export const ECSSerialization = {
    createSerializer,
    createDeserializer,
};
