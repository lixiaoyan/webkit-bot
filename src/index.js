import path from "path";
import fs from "fs";

import "babel-polyfill";

import pino from "pino";
import Telegraf from "telegraf";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_LIST = process.env.TELEGRAM_CHAT_LIST.split(",").map(Number);
const PLUGINS = ["screenshot", "ping", "commit"];

const logger = pino();
if (process.env.NODE_ENV === "production") {
  logger.level = "info";
} else {
  logger.level = "trace";
}

const main = async () => {
  const app = new Telegraf(TOKEN);

  app.use(async (ctx, next) => {
    logger.debug(ctx.message);
    if (!CHAT_LIST.includes(ctx.chat.id)) {
      return;
    }
    await next(ctx);
  });

  const plugins = await Promise.all(
    PLUGINS.map(name => {
      const plugin = require(`./plugins/${name}`).default;
      return plugin(app, logger);
    }),
  );

  const help = plugins
    .filter(plugin => plugin && plugin.help)
    .map(plugin => plugin.help)
    .join("\n");

  app.hears("'help", ctx => ctx.reply(help));

  app.catch(err => {
    logger.error(err);
  });

  const exit = async () => {
    await Promise.all(
      plugins
        .filter(plugin => plugin && plugin.exit)
        .map(plugin => plugin.exit()),
    );
    process.exit(0);
  };
  process.on("SIGINT", exit);
  process.on("SIGTERM", exit);
  process.on("SIGQUIT", exit);

  app.startPolling();
};

main();
