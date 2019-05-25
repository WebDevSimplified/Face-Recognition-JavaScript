const imageUpload = document.getElementById('imageUpload')

Promise.all([
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
]).then(start)

async function start() {
  let canvas
  let image
  const labeledFaceDescriptors = await loadLabeledImages()
  document.body.append('Loaded')
  imageUpload.addEventListener('change', async () => {
    if (canvas) canvas.remove()
    if (image) image.remove()
    image = await faceapi.bufferToImage(imageUpload.files[0])
    document.body.append(image)
    canvas = faceapi.createCanvasFromMedia(image)
    document.body.append(canvas)
    const displaySize = { width: image.width, height: image.height }
    faceapi.matchDimensions(canvas, displaySize)
    const detections = await faceapi.detectAllFaces(image).withFaceLandmarks().withFaceDescriptors()
    const resizedDetections = faceapi.resizeResults(detections, displaySize)
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6)
    const results = resizedDetections.map(d => faceMatcher.findBestMatch(d.descriptor))
    results.forEach((bestMatch, i) => {
      const box = resizedDetections[i].detection.box
      const text = bestMatch.toString()
      const drawBox = new faceapi.draw.DrawBox(box, { label: text })
      drawBox.draw(canvas)
    })
  })
}

function loadLabeledImages() {
  const labels = ['Black Widow', 'Captain America', 'Captain Marvel', 'Hawkeye', 'Jim Rhodes', 'Thor', 'Tony Stark']
  return Promise.all(
    labels.map(async label => {
      const descriptions = []
      for (let i = 1; i <= 2; i ++) {
        const img = await faceapi.fetchImage(`https://raw.githubusercontent.com/WebDevSimplified/Face-Recognition-JavaScript/master/labeled_images/${label}/${i}.jpg`)
        
        const detections = await faceapi.detectSingleFace(img).withFaceLandmarks().withFaceDescriptor()
        descriptions.push(detections.descriptor)
      }
      
      return new faceapi.LabeledFaceDescriptors(label, descriptions)
    })
  )
}