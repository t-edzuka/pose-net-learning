import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as posenet from "@tensorflow-models/posenet";

import { useEffect, useRef, useState } from "react";

import Webcam from "react-webcam";

// async function doTraining(model, xs, ys) {
//   const history =
//     await model.fit(xs, ys,
//       {
//         epochs: 200,
//         callbacks: {
//           onEpochEnd: async (epoch, logs) => {
//             console.log("Epoch:"
//               + epoch
//               + " Loss:"
//               + logs.loss);
//
//           }
//         }
//       });
//   console.log(history.params);
// }

// const handleRunTraining = (event) => {
//   const model = tf.sequential();
//   model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
//
//   model.compile({ optimizer: tf.train.sgd(0.1), loss: 'meanSquaredError' });
//   model.summary();
//
//   // Equation: y = 2x - 1
//   const xs = tf.tensor2d([-1.0, 0.0, 1.0, 2.0, 3.0, 4.0], [6, 1]);
//   const ys = tf.tensor2d([-3.0, -1.0, 2.0, 3.0, 5.0, 7.0], [6, 1]);
//   doTraining(model, xs, ys).then(() => {
//     const prediction = model.predict(tf.tensor2d([10], [1, 1]));
//     var res = prediction.dataSync()[0];
//     prediction.dispose();
//
//     console.log('Result: ' + res);
//   });
// }

function App() {
  const [model, setModel] = useState(null);
  const webcamRef = useRef(null);

  // poseEstimationLoop is just a number
  const poseEstimationLoop = useRef(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);

  const PosenetConfig = {
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 800, height: 600 },
    multiplier: 0.75,
  };

  const videoExists = (webcamRef) => {
    return webcamRef && webcamRef.current;
  };

  const videoIsReady = (webcamRef) => {
    return (
      webcamRef.current.video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
    ); // equal to 4
  };

  // setup video property to pass the estimate function;
  const getSetVideoWH = (webcamRef) => {
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.Height = videoHeight;
    return webcamRef;
  };

  function measureTime(end, start) {
    return (end - start).toFixed(1);
  }

  async function runPoseEstimation(webcamRef) {
    const readyWebCamRef = getSetVideoWH(webcamRef);
    const video = readyWebCamRef.current.video;

    if (model) {
      // Start estimation time
      const startTime = new Date();
      const pose = await model.estimateSinglePose(video, {
        flipHorizontal: false,
      });
      console.log(pose); // logging pose
      const endTime = new Date();
      console.log(measureTime(endTime, startTime), "s elapsed for estimation");
      console.log(tf.getBackend()); //　logging tensorflow.backend
    } else {
      console.log("Waiting model loading");
    }
  }

  // Start PoseEstimation with interval:100 ms
  // Mutate poseEstimationLoop: number,signature of "Timer Id"
  function startPoseEstimation(interval = 100) {
    if (videoExists(webcamRef) && videoIsReady(webcamRef)) {
      poseEstimationLoop.current = setInterval(
        async () => void (await runPoseEstimation(webcamRef)),
        interval
      );
    } else {
      console.log("Video is not ready");
    }
  }

  const stopPoseEstimation = (timerId) => {
    clearInterval(timerId);
  };

  const handlePoseEstimation = () => {
    setIsPoseEstimation((prevState) => !prevState);
    isPoseEstimation
      ? stopPoseEstimation(poseEstimationLoop.current)
      : startPoseEstimation();
  };

  async function loadPoseNet() {
    const net = await posenet.load(PosenetConfig);
    setModel((_) => net);
    console.log("Posenet Model Loaded...");
  }

  // Start side-effect after rendering
  useEffect(() => void loadPoseNet(), []);

  return (
    <div className="App">
      <Webcam
        ref={webcamRef}
        style={{
          position: "absolute",
          marginLeft: "auto",
          marginRight: "auto",
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
          width: 800,
          height: 600,
        }}
      />
      <button
        style={{
          position: "relative",
          marginLeft: "auto",
          marginRight: "auto",
          top: 320,
          left: 0,
          right: 0,
          textAlign: "center",
          zindex: 9,
        }}
        onClick={handlePoseEstimation}
      >
        {isPoseEstimation ? "Stop" : "Start"}
      </button>
      <hr />
    </div>
  );
}

export default App;
