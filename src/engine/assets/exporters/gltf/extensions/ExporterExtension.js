export class ExporterExtension {
    name;
    writer;
    constructor(exporter) {
        this.writer = exporter;
    }
}
