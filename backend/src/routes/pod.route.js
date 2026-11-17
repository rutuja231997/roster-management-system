const express = require("express");

const podController = require("../controllers/pod.controller");

const podRouter = express.Router();

//create a pod
podRouter.post("/create-pod", podController.createPod);

//get all pods
podRouter.get("/pods", podController.getAllPods);

// get pod by id
podRouter.get("/pod/:id", podController.getPodById);

//update pod
podRouter.patch("/update-pod/:id", podController.updatePod);

// assign pod lead
podRouter.patch("/assign-pod-lead/:id", podController.assignPodLead);

module.exports = podRouter;
