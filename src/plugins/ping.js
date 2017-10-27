export default app => {
  app.hears("'ping", ctx => ctx.reply("pong"));

  return {
    help: ["'ping - pong"],
  };
};
