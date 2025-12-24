const {
  Client,
  GatewayIntentBits,
  Partials,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} = require("discord.js");
const fs = require("fs");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Channel]
});

/* ====== CONFIG ====== */
const TOKEN = "MTQ1MzQ0NzcwODU2NzE0MjQyMA.G4cf6o.qfjjyrhwmc10YJhGybxGGoTX13WvYcGrcV1Sbk";
const SERVER_ID = "1413287781450387500";

const ADD_CHANNEL = "1453442012312506553";
const REMOVE_CHANNEL = "1453442513347022858";
const VALUES_CHANNEL = "1453442702451408937";
const WINLOSE_CHANNEL = "1453451126639689873";
/* ==================== */

const loadItems = () =>
  JSON.parse(fs.readFileSync("./items.json", "utf8"));
const saveItems = (data) =>
  fs.writeFileSync("./items.json", JSON.stringify(data, null, 2));

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

/* ================= ADD ITEM ================= */
client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;

  /* ADD */
  if (msg.channel.id === ADD_CHANNEL && msg.content === "!add") {
    const filter = (m) => m.author.id === msg.author.id;

    await msg.reply("📝 **Item name?**");
    const name = (await msg.channel.awaitMessages({ filter, max: 1 })).first().content;

    await msg.reply("💰 **Item value?**");
    const value = parseInt(
      (await msg.channel.awaitMessages({ filter, max: 1 })).first().content
    );

    await msg.reply("🖼️ **Item image URL?**");
    const image = (await msg.channel.awaitMessages({ filter, max: 1 })).first().content;

    await msg.reply("📦 **Item type? (fruit / skin / gamepass)**");
    const type = (await msg.channel.awaitMessages({ filter, max: 1 })).first().content.toLowerCase();

    const items = loadItems();
    items.push({ name, value, image, type });
    saveItems(items);

    msg.reply(`✅ **${name} added successfully!**`);
  }

  /* REMOVE */
  if (msg.channel.id === REMOVE_CHANNEL && msg.content === "!remove") {
    const filter = (m) => m.author.id === msg.author.id;

    await msg.reply("🗑️ **Item name to remove?**");
    const name = (await msg.channel.awaitMessages({ filter, max: 1 })).first().content;

    const items = loadItems();
    const item = items.find((i) => i.name.toLowerCase() === name.toLowerCase());
    if (!item) return msg.reply("❌ Item not found");

    const embed = new EmbedBuilder()
      .setTitle(item.name)
      .setDescription(`Value: **${item.value}**\nType: **${item.type}**`)
      .setImage(item.image);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("confirm_delete")
        .setLabel("Confirm")
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId("cancel_delete")
        .setLabel("Cancel")
        .setStyle(ButtonStyle.Danger)
    );

    const sent = await msg.reply({ embeds: [embed], components: [row] });

    const collector = sent.createMessageComponentCollector({ time: 15000 });
    collector.on("collect", (i) => {
      if (i.customId === "confirm_delete") {
        saveItems(items.filter((x) => x !== item));
        i.update({ content: "✅ Item deleted", embeds: [], components: [] });
      } else {
        i.update({ content: "❌ Cancelled", embeds: [], components: [] });
      }
    });
  }

  /* VALUES */
  if (msg.channel.id === VALUES_CHANNEL) {
    const items = loadItems();

    if (msg.content === "!list") {
      const menu = new StringSelectMenuBuilder()
        .setCustomId("type_select")
        .setPlaceholder("Select item type")
        .addOptions(
          { label: "Fruits", value: "fruit" },
          { label: "Skins", value: "skin" },
          { label: "Gamepasses", value: "gamepass" }
        );

      return msg.reply({
        components: [new ActionRowBuilder().addComponents(menu)]
      });
    }

    const item = items.find((i) =>
      i.name.toLowerCase() === msg.content.toLowerCase()
    );
    if (!item) return;

    const embed = new EmbedBuilder()
      .setTitle(`${item.name} (${item.type})`)
      .setDescription(`Value: **${item.value}**`)
      .setImage(item.image);

    msg.reply({ embeds: [embed] });
  }

  /* WIN / LOSE */
  if (msg.channel.id === WINLOSE_CHANNEL) {
    const items = loadItems();
    const parts = msg.content.toLowerCase().split(" for ");
    if (parts.length !== 2) return;

    const left = parts[0].split(" ");
    const right = parts[1].split(" ");

    const sum = (arr) =>
      arr.reduce((t, n) => {
        const it = items.find((i) => i.name.toLowerCase() === n);
        return it ? t + it.value : t;
      }, 0);

    const leftVal = sum(left);
    const rightVal = sum(right);

    const result = leftVal < rightVal ? "✅ WIN" : "❌ LOSE";

    msg.reply(
      `${left.join(" + ")} = **${leftVal}**\nfor\n${right.join(
        " + "
      )} = **${rightVal}**\n\n**Result: ${result}**`
    );
  }
});

/* LIST MENU */
client.on("interactionCreate", async (i) => {
  if (!i.isStringSelectMenu()) return;
  if (i.customId !== "type_select") return;

  const items = loadItems().filter((x) => x.type === i.values[0]);
  const embed = new EmbedBuilder()
    .setTitle(`${i.values[0]} items`)
    .setDescription(items.map((x) => x.name).join("\n") || "None");

  i.update({ embeds: [embed], components: [] });
});

client.login(TOKEN);

