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

  const PosenetConfig = {
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 800, height: 600 },
    multiplier: 0.75,
  };

  async function loadPoseNet() {
    const net = await posenet.load(PosenetConfig);
    setModel((_) => net);
    console.log("Posenet Model Loaded...");
    console.log(model);
  }

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
      <button onClick={() => console.log("Place Holder for run training")}>
        Run training
      </button>
      <hr />
    </div>
  );
}

export default App;
