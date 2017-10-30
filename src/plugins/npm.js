import escape from "escape-html";
import axios from "axios";

export default app => {
  const META = {
    version: "version",
    description: "description",
    homepage: "homepage",
  };

  app.hears(/^'npm /, async ctx => {
    const name = ctx.message.text.split(/\s+/, 2)[1];

    let info;
    try {
      info = (await axios.get(
        `https://registry.npmjs.org/${name.replace(/\//g, "%2F")}/latest`,
      )).data;
    } catch (err) {
      if (err.response.status === 404) {
        await ctx.reply("Package not found.");
      } else {
        await ctx.reply(`Network error: ${err.response.status}.`);
      }
      return;
    }

    const link = `https://www.npmjs.com/package/${info.name}`;

    await ctx.reply(
      [
        `<b>npm</b> › <a href="${escape(link)}">${escape(info.name)}</a>`,
        "┄┄",
        ...Object.entries(META)
          .map(([key, name]) => `<b>${escape(name)}</b>\n${escape(info[key])}`)
          .filter(Boolean),
      ].join("\n"),
      { parse_mode: "HTML", disable_web_page_preview: true },
    );
  });

  app.hears(/^'npm\/search /, async ctx => {
    const pattern = ctx.message.text.split(/\s+/, 2)[1];

    let result;
    try {
      result = (await axios.get(
        `https://registry.npmjs.org/-/v1/search?text=${encodeURIComponent(
          pattern,
        )}&size=5`,
      )).data;
    } catch (err) {
      await ctx.reply(`Network error: ${err.response.status}.`);
      return;
    }

    await ctx.reply(
      [
        `<b>npm/search</b> › ${escape(pattern)}`,
        "┄┄",
        ...result.objects.map(
          item =>
            `<b>${escape(item.name)}</b>` + item.description
              ? ` › ${escape(item.description)}`
              : "",
        ),
      ].join("\n"),
      { parse_mode: "HTML", disable_web_page_preview: true },
    );
  });

  return {
    help: [
      "<b>'npm &lt;package&gt;</b> › show package info",
      "<b>'npm/search &lt;pattern&gt;</b> › search packages",
    ].join("\n"),
  };
};
