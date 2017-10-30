import axios from "axios";

export default app => {
  app.hears("'commit", async ctx => {
    const commit = (await axios.get("https://whatthecommit.com/index.txt", {
      responseType: "text",
    })).data;
    await ctx.reply(commit);
  });

  return {
    help: "<b>'commit</b> - https://whatthecommit.com/",
  };
};
