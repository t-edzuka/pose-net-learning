import "./App.css";
import * as tf from "@tensorflow/tfjs";
import "@tensorflow/tfjs-backend-webgl";
import * as posenet from "@tensorflow-models/posenet";

import React, { useEffect, useRef, useState } from "react";
import {
  Grid,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  makeStyles,
} from "@material-ui/core";

import Webcam from "react-webcam";
import { drawKeypoints, drawSkeleton } from "./utilities/draw-pose";

const webcamStyle = {
  marginTop: "10px",
  marginBottom: "10px",
  marginLeft: "auto",
  marginRight: "auto",
  left: 0,
  right: 0,
  textAlign: "center",
  zindex: 9,
  width: 800,
  height: 600,
};

const useStyles = makeStyles(() => ({
  backgroundAppBar: {
    background: "#1875d2",
    flexGrow: 1,
    textAlign: "left",
  },
  statsCard: {
    width: "250px",
    margin: "10px",
  },
}));

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
  // Hooks variable declarations that determine App's states.
  const [model, setModel] = useState(null);

  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  // poseEstimationLoop is assumed to be a timerID, which is just a "number" !!
  const poseEstimationLoop = useRef(null);
  const [isPoseEstimation, setIsPoseEstimation] = useState(false);

  // UI definition
  const classes = useStyles();
  // End Hooks declarations

  const PosenetConfig = {
    architecture: "MobileNetV1",
    outputStride: 16,
    inputResolution: { width: 800, height: 600 },
    multiplier: 0.75,
  };

  // ↓ Utility functions that might be moved to another modules.
  const videoExists = (webcamRef) => {
    return webcamRef && webcamRef.current;
  };

  const videoIsReady = (webcamRef) => {
    return (
      webcamRef.current.video.readyState === HTMLMediaElement.HAVE_ENOUGH_DATA
    ); // equal to 4
  };

  /**
  @param video: HTMLVideoElement
   */
  function getVideoSize(video) {
    return { videoWidth: video.videoWidth, videoHeight: video.videoHeight };
  }

  // setup video property to pass the estimate function;
  const getSetVideoWH = (webcamRef) => {
    const { videoWidth, videoHeight } = getVideoSize(webcamRef.current.video);

    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;
    return webcamRef;
  };

  function measureTime(end, start) {
    return (end - start).toFixed(1);
  }
  // Utility functions end

  async function runPoseEstimation(webcamRef) {
    const readyWebCamRef = getSetVideoWH(webcamRef);
    const video = readyWebCamRef.current.video;

    const { videoWidth, videoHeight } = getVideoSize(video);

    if (model) {
      // Start estimation time
      const startTime = new Date();

      // Estimation here!!
      const pose = await model.estimateSinglePose(video, {
        flipHorizontal: false,
      });

      // Draw points detected on video.
      // 幅高さは800などの固定値を入れるとだめで,video.videoWidthとvideoを参照しないとずれる
      drawCanvas(pose, videoWidth, videoHeight, canvasRef);

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

  // Call start and stop poseEstimation using this handler
  const handlePoseEstimation = () => {
    setIsPoseEstimation((prevState) => !prevState);
    isPoseEstimation
      ? stopPoseEstimation(poseEstimationLoop.current)
      : startPoseEstimation();
  };

  // About canvas drawing functions that might be moved to another modules
  const canvasIsOk = (canvasRef) => {
    return !!canvasRef;
  };

  const drawCanvas = (pose, videoWidth, videoHeight, canvasRef) => {
    if (canvasIsOk(canvasRef)) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoWidth;
      canvasRef.current.height = videoHeight;
      drawKeypoints(pose["keypoints"], 0.5, ctx);
      drawSkeleton(pose["keypoints"], 0.5, ctx);
    }
  };
  // Drawing functions end

  async function loadPoseNet() {
    const net = await posenet.load(PosenetConfig);
    setModel((_) => net);
    console.log("Posenet Model Loaded...");
  }

  // Start side-effect after rendering
  useEffect(() => void loadPoseNet(), []);
  return (
    <div className="App">
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <AppBar position={"static"} className={classes.backgroundAppBar}>
            <Toolbar variant={"dense"}>
              <Typography
                variant={"h6"}
                color={"inherit"}
                className={classes.title}
              >
                Pose Assistant
              </Typography>
              <Button color="inherit">Start Workout</Button>
              <Button color="inherit">History</Button>
              <Button color="inherit">Reset</Button>
            </Toolbar>
          </AppBar>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card className={classes.statsCard}>
            <CardContent>
              {/*<Webcam ref={webcamRef} style={webcamStyle} />*/}
              {/*<canvas ref={canvasRef} style={webcamStyle} />*/}

              <Typography
                className={classes.title}
                color="textSecondary"
                gutterBottom
              >
                Jumping Jacks
              </Typography>
              <Typography variant="h2" component="h2" color="secondary">
                75
              </Typography>
              <CardActions style={{ justifyContent: "center" }}>
                <Grid container spacing={0}>
                  <Grid item xs={12}>
                    <Toolbar style={{ justifyContent: "center" }} />
                  </Grid>
                </Grid>
              </CardActions>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/*<button style={buttonStyle} onClick={handlePoseEstimation}>*/}
      {/*  {isPoseEstimation ? "Stop" : "Start"}*/}
      {/*</button>*/}
      {/*</header>*/}
    </div>
  );
}

export default App;
