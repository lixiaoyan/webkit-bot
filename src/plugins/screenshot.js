import Telegraf from "telegraf";
import puppeteer from "puppeteer";
import Linkify from "linkify-it";
import tlds from "tlds";

const linkify = new Linkify();
linkify
  .tlds(tlds)
  .add("ftp:", null)
  .add("mailto:", null)
  .set({ fuzzyIP: true, fuzzyEmail: false });

export default async (app, logger) => {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox"],
    ignoreHTTPSErrors: true,
  });

  app.on(
    "text",
    Telegraf.fork(async ctx => {
      if (!linkify.test(ctx.message.text)) return;

      const url = linkify.match(ctx.message.text)[0].url;
      logger.info("Scraping screenshot: %s", url);

      let title;
      let screenshot;

      const page = await browser.newPage();
      try {
        await page.setViewport({
          width: 1280,
          height: 720,
        });
        await page.goto(url, {
          waitUntil: "networkidle2",
        });
        title = await page.title();
        screenshot = await page.screenshot({
          type: "jpeg",
          quality: 80,
        });
      } catch (err) {
        await ctx.reply(err.message);
        throw err;
      } finally {
        await page.close();
      }

      await ctx.replyWithPhoto({ source: screenshot }, { caption: title });
    }),
  );

  return {
    exit: () => browser.close(),
  };
};
