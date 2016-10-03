const Discord = require('discord.js');
const client = new Discord.Client({
	fetch_all_members: false,
	disable_everyone: true,
	message_sweep_interval: 3600
});
const util = require('util');
const escapeRegex = require('escape-string-regexp');

const cfg = require('./conf');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./db.sqlite');
const delay = 5000;

client.on('ready', () => {
	console.log(`Connected to Discord as ${client.user.username} on ${client.guilds.size} guilds with ${client.channels.size} channels.`);
});

client.on('message', message => {
	if (message.author.id != client.user.id) return;
	if (message.content.startsWith(cfg.prefix)) {
		setTimeout(function () {
			const cmd = message.content.split(' ')[0].slice(cfg.prefix.length).toLowerCase();
			const params = message.content.split(' ').slice(1);
			console.log(`Command: '${cmd}' was used with the parameters '${params}'`);

			switch (cmd) {
				case 'ping':
					message.edit(`pong \`${Date.now() - message.timestamp - 1000}ms\``).then(message.delete(delay));
					break;
				case 'playgame':
					if (params.length < 1) return message.edit(cmdError(cmd)).then(message.delete(delay));
					client.user.setStatus('online', params);
					message.edit(`Now currently playing \`${params}\``).then(message.delete(delay));
					break;
				case 'eval':
					if (params.length < 1) return message.edit(cmdError(cmd)).then(message.delete(delay));

					try {
						var code = message.content.replace(`${cfg.prefix}${cmd} `, '');
						const evStart = process.hrtime();
						var evRes = eval(code);
						var evDiff = process.hrtime(evStart);
						message.edit(prettify(evRes, evDiff, code));

					} catch (err) {
						message.edit(`__INPUT__ \`\`\`javascript\n${code}\`\`\`\n__OUTPUT__\`\`\`apache\n${err}\`\`\``);
					}
					break;

				case 'tag':
					if (params.length < 1) return message.edit(cmdError(cmd)).then(message.delete(delay));
					db.get(`SELECT text FROM tags WHERE name='${params[0]}';`, function (err, res) {
						if (err) {
							console.log(err);
						} else if (res) {
							message.edit(res.text);
						} else if (!res) {
							message.edit(`The tag \`${params[0]}\` does not exist!`);
						}
					});
					break;
				case 'addtag':
					if (params.length < 1) return message.edit(cmdError(cmd)).then(message.delete(delay));

					var tag = params[0];
					var value = params.slice(1).join(' ');
					db.serialize(function () {
						db.get(`INSERT INTO tags VALUES ('${tag}', '${value}');`, function (err, res) {
							if (err) { return console.log(err); }
							message.edit(`☑ Added \`${tag}\` to the database.`).then(message.delete(delay));
						});
					});
					break;
				case 'deltag':
					if (params.length < 1) return message.edit(cmdError(cmd)).then(message.delete(delay));
					var tag = params[0];
					db.serialize(function () {
						db.get(`DELETE FROM tags WHERE name='${tag}'`, function (res, err) {
							if (err) { return console.log(err); }
							message.edit(`🇽 Deleted \`${tag}\` from the database.`).then(message.delete(delay));
						});
					});
					break;
				case 'tags':
					db.serialize(function () {
						db.all("SELECT * FROM tags", (err, rows) => {
							if (err) { log(err) }
							message.edit(`Tags: ${rows.map(r => `\`${r.name}\``).join(", ")}`);
						});
					});
					break;
			}
		}, 500);
	}
});

client.login(cfg.token);

/* Credits to Gawdl3y for prettify and also sensitivePattern. Taken from his bot framework, discord-graf: https://github.com/Gawdl3y/discord-graf */

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');

function prettify(result, hrDiff, input) {
	const inspected = util.inspect(result, { depth: 0 })
		.replace(nlPattern, '\n')
		.replace(sensitivePattern(), '--removed--')
		.replace(client.user.email, '--removed--');

	const time = parseFloat(`${hrDiff[0] > 0 ? `${hrDiff[0]}s ` : ''}${hrDiff[1] / 1000000}`);
	return `__INPUT__ \`\`\`javascript\n${input}\`\`\`\n__OUTPUT__ \`\`\`javascript\n${inspected}\`\`\`\n _\`Executed in in ${time}ms.\`_`;
}

function sensitivePattern() {
	if (!this._sensitivePattern) {
		let pattern = '';
		if (client.token) pattern += escapeRegex(client.token);
		if (client.token) pattern += (pattern.length > 0 ? '|' : '') + escapeRegex(client.token);
		if (client.email) pattern += (pattern.length > 0 ? '|' : '') + escapeRegex(client.email);
		if (client.password) pattern += (pattern.length > 0 ? '|' : '') + escapeRegex(client.password);
		this._sensitivePattern = new RegExp(pattern, 'gi');
	}
	return this._sensitivePattern;
}

setTimeout(function () {
	//do something
}, 1000);

function cmdError(type) {
	if (type == "playgame") {
		return '<:dsmWut:222935736310169610> Missing game to play!';
	} else if (type == "eval") {
		return '<:dsmWut:222935736310169610> Missing expression to evaluate!';
	} else if (type == "tag") {
		return '<:dsmWut:222935736310169610> Missing tag to post!';
	} else if (type == "deltag") {
		return '<:dsmWut:222935736310169610> Missing tag to delete!';
	} else if (type == "addtag") {
		return '<:dsmWut:222935736310169610> Missing tag to add!';
	}
}