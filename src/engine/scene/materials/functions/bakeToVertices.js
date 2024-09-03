export default async function bakeToVertices(
    entity,
    material,
    colors,
    maps,
    root,
    nuPrototype = "MeshMatcapMaterial",
) {
    // const pending = new Array<>()
    // if (root) {
    //   iterateEntityNode(
    //     entity,
    //     (entity) => {
    //       const mesh = getComponent(entity, MeshComponent)
    //       //for each vertex in each mesh with material assigned:
    //       const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    //       if (!materials.includes(material)) return //skip meshes without selected material
    //       const samples = Promise.all([
    //         ...maps
    //           .filter(({ field }) => (material[field])?.isTexture)
    //           .map((map) => {
    //             const texture = material[map.field]
    //             const canvas = document.createElement('canvas')
    //             const uv = mesh.geometry.getAttribute(map.attribName)
    //             return new Promise<Color[]>((resolve) => {
    //               createReadableTexture(texture, { keepTransform: true, flipX: false, flipY: true }).then(
    //                 (_texture) => {
    //                   const image = _texture.image
    //                   canvas.width = image.width
    //                   canvas.height = image.height
    //                   const ctx = canvas.getContext('2d')
    //                   ctx.drawImage(image, 0, 0)
    //                   const result = new Array<Color>()
    //                   for (let i = 0; i < uv.count; i++) {
    //                     const sampleUv = [uv.getX(i), uv.getY(i)]
    //                     const x = sampleUv[0] * canvas.width
    //                     const y = (1 - sampleUv[1]) * canvas.height
    //                     const pixelData = Float32Array.from(ctx.getImageData(x, y, 1, 1).data).map((x) => x / 255)
    //                     const pixelColor = new Color(...pixelData)
    //                     result.push(pixelColor)
    //                   }
    //                   canvas.remove()
    //                   ;(material )[map.field] = null
    //                   resolve(result)
    //                 }
    //               )
    //             })
    //           }),
    //         ...colors
    //           .filter((field) => (material[field])?.isColor)
    //           .map((field) => {
    //             const color = material[field]
    //             const result = new Array<Color>(mesh.geometry.getAttribute('position').count)
    //             result.fill(color)
    //             ;(material )[field] = new Color('#fff')
    //             return Promise.resolve(result)
    //           })
    //       ]).then((samples) => {
    //         const composited = samples.reduce(
    //           (sample1, sample0) =>
    //             sample0.map((col, idx) => (sample1.length <= idx ? col.clone() : col.clone().multiply(sample1[idx]))),
    //           []
    //         )
    //         if (composited.length > 0)
    //           mesh.geometry.setAttribute(
    //             'color',
    //             new BufferAttribute(Float32Array.from(composited.flatMap((sample) => sample.toArray())), 3)
    //           )
    //       })
    //       pending.push(samples)
    //     },
    //     (entity) => hasComponent(entity, MeshComponent)
    //   )
    // }
    // await Promise.all(pending)
    // const nuMat = updateMaterialPrototype(entity, nuPrototype)
    // if (nuMat) {
    //   nuMat.vertexColors = true
    //   nuMat.defines = nuMat.defines ?? {}
    //   nuMat.defines['USE_COLOR'] = ''
    //   nuMat.needsUpdate = true
    // }
}
