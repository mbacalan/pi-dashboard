#!/usr/bin/env node

import Fastify from "fastify";
import ws from '@fastify/websocket'
import MC from "minecraft-protocol"
import { spawn } from "node:child_process"

let mcServerProcess;

const fastify = Fastify({
  logger: true
})

await fastify.register(ws)

fastify.register(async function (fastify) {
  fastify.get("/", { websocket: true }, (connection) => {
    connection.socket.on("message", async message => {
      if (message == "start") {
        mcServerProcess = spawn('java', [
          "-Xms1G",
          "-Xmx1G",
          "-XX:+UseG1GC",
          "-XX:+ParallelRefProcEnabled",
          "-XX:MaxGCPauseMillis=200",
          "-XX:+UnlockExperimentalVMOptions",
          "-XX:+DisableExplicitGC",
          "-XX:+AlwaysPreTouch",
          "-XX:G1NewSizePercent=30",
          "-XX:G1MaxNewSizePercent=40",
          "-XX:G1HeapRegionSize=8M",
          "-XX:G1ReservePercent=20",
          "-XX:G1MixedGCCountTarget=4",
          "-XX:InitiatingHeapOccupancyPercent=15",
          "-XX:G1MixedGCLiveThresholdPercent=90",
          "-XX:G1RSetUpdatingPauseTimePercent=5",
          "-XX:G1HeapWastePercent=5",
          "-XX:+PerfDisableSharedMem",
          "-XX:MaxTenuringThreshold=1",
          "-Dusing.aikars.flags=https://mcflags.emc.gs",
          "-Daikars.new.flags=true",
          "-jar",
          "paper.jar",
          "--nogui",
        ], { cwd: process.env.MC_SERVER_DIR });

        mcServerProcess.once("spawn", () => {
          connection.socket.send(JSON.stringify({ message: "start", event: "spawn", success: true }))
        })

        mcServerProcess.on("error", (err) => {
          connection.socket.send(JSON.stringify({ message: "start", event: "spawn", success: false, error: err }))
        })

        mcServerProcess.stdout.on("data", (data) => {
          connection.socket.send(JSON.stringify({ message: "start", event: "data", data: data.toString() }))
        })
      }

      if (message == "stop") {
        mcServerProcess.once("close", () => {
          connection.socket.send(JSON.stringify({ message: "stop", event: "data", success: true }))
        })

        mcServerProcess.kill()
      }

      if (message == "status") {
        if (Object.keys(process.env).includes('MC_SERVER_DIR', 'MC_SERVER_URL', 'MC_SERVER_PORT') == false) {
          connection.socket.send(JSON.stringify({ message: "status", event: "error", error: "Server environment vars are not set properly!" }))
          return
        }

        try {
          const status = await MC.ping({ host: process.env.MC_SERVER_URL, port: process.env.MC_SERVER_PORT })

          connection.socket.send(JSON.stringify({ message: "status", online: true, ...status }))
        } catch(err) {
          connection.socket.send(JSON.stringify({ message: "status", online: false, ...err }))
        }
      }
    })
  })
})

try {
  await fastify.listen({ host: process.env.SERVER_HOST, port: 3001 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
