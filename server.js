import Fastify from "fastify";
import MC from "minecraft-protocol"
import { spawn } from "node:child_process"

let mcServerProcess;

const fastify = Fastify({
  logger: true
})

fastify.get("/status", async function handler(_, reply) {
  try {
    const status = await MC.ping({ host: "192.168.178.251", port: "25565" })

    reply.code(200).send({ online: true, ...status })
  } catch(err) {
    reply.code(200).send({ online: false, ...err })
  }

  // const exampleStatus = {
  //   version: { name: 'Paper 1.20.1', protocol: 763 },
  //   enforcesSecureChat: true,
  //   description: { text: 'A Minecraft Server' },
  //   players: { max: 20, online: 0, sample: [{ id, name }]},
  //   latency: 4
  // }
})

fastify.post("/start", function handler(request, reply) {
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
    "-jar paper.jar",
    "--nogui",
  ]);

  mcServerProcess.once("spawn", () => {
    reply.code(200).send({ success: true })
  })

  mcServerProcess.on("error", (err) => {
    console.log("error!", err)
    reply.code(200).send({ success: false })
  })
})

fastify.post("/stop", function handler(_, reply) {
  mcServerProcess.once("close", () => {
    reply.code(200).send({ success: true })
  })
})

try {
  await fastify.listen({ port: 3000 })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
