import escape from "escape-html";
import axios from "axios";

export default app => {
  const META = {
    version: "version",
    description: "description",
    homepage: "homepage",
  };

  app.hears(/^'npm /, async ctx => {
    const name = ctx.message.text
      .replace(/^'npm /, "")
      .trim()
      .toLowerCase();

    let info;
    try {
      info = (await axios.get(
        `https://registry.npmjs.org/${encodeURIComponent(name)}/latest`,
      )).data;
    } catch (err) {
      if (err.response.status === 404) {
        await ctx.reply("Package not found.");
      }
      return;
    }

    const link = `https://www.npmjs.com/package/${encodeURIComponent(
      info.name,
    )}`;

    await ctx.reply(
      [
        `<b>npm</b>: <a href="${escape(link)}">${escape(info.name)}</a>`,
        "┄┄",
        ...Object.entries(META)
          .map(([key, name]) => `<b>${escape(name)}</b>\n${escape(info[key])}`)
          .filter(Boolean),
      ].join("\n"),
      { parse_mode: "HTML", disable_web_page_preview: true },
    );
  });

  return {
    help: "<b>'npm &lt;package&gt;</b> - show package info",
  };
};
