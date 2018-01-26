import _ from "lodash";
import escape from "escape-html";
import axios from "axios";

export default app => {
  const META = {
    "dist-tags.latest": "version",
    description: "description",
    homepage: "homepage",
  };

  app.hears(/^'npm /, async ctx => {
    const name = ctx.message.text.split(/\s+/, 2)[1];

    let info;
    let size;
    try {
      info = (await axios.get(
        `https://registry.npmjs.org/${name.replace(/\//g, "%2F")}`,
      )).data;
      size = (await axios.get(
        `https://bundlephobia.com/api/size?package=${encodeURIComponent(
          info.name,
        )}`,
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
          .map(([path, name]) => {
            const value = _.get(info, path);
            return value && `<b>${escape(name)}</b>\n${escape(value)}`;
          })
          .filter(Boolean),
        `<b>size</b>\n${size.size} / ${size.gzip} (gzipped)`,
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
            `<b>${escape(item.package.name)}</b>` +
            (item.package.description
              ? ` › ${escape(item.package.description)}`
              : ""),
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
