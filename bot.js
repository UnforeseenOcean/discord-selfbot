const Discord = require('discord.js');
const client = new Discord.Client();
const util = require('util');
const escapeRegex = require('escape-string-regexp');

const cfg = require('./conf');
const sql = require('sqlite');
let db;

sql.open('./db.sqlite').then(conn => {
	db = conn;
});


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
					message.edit(`pong \`${Date.now() - message.timestamp - 500}ms\``);
					break;
				case 'game':
					client.user.setStatus('online', params);
					message.edit(`Now currently playing \`${params}\``).then(message.delete(2000));
					break;
				case 'eval':
					if (params.length < 1) return message.edit('__ERROR__ => Missing expression to evaluate!').then(message.delete(2000));

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
					if (params.length < 1) return message.edit('__ERROR__ -> Missing argument in command.').then(message.delete(2000));
					db.get(`SELECT text FROM tags WHERE name='${params[0]}';`).then(res => {
						message.edit(res.text);
					}).catch(err => {
						if(err.toString().includes('undefined')) {
							message.edit(`The tag \`${params[0]}\` does not exist!`);
						}
					});
					break;
				case 'addtag':
					if (params.length < 1) return message.edit('__ERROR__ -> Missing argument in command.').then(message.delete(2000));

					var tag = params[0];
					var value = params.slice(1).join(' ');
					db.get(`INSERT INTO tags VALUES ('${tag}', '${value}');`).then(res => {
						message.edit(`Added \`${tag}\` to the database.`).then(message.delete(2000));
					}).catch(console.log);

					break;
				case 'deltag':
					if (params.length < 1) return message.edit('__ERROR__ -> Missing argument in command.').then(message.delete(2000));

					var tag = params[0];
					db.get(`DELETE FROM tags WHERE name='${tag}'`).then(res => {
						message.edit(`Deleted \`${tag}\` from the database.`).then(message.delete(2000));
					}).catch(console.log);
					break;
			}
		}, 500);
	}
});

client.login(cfg.token);

/* Credits to Gawdl3y for prettify and also sensitivePattern. Taken from his bot, discord-graf: https://github.com/Gawdl3y/discord-graf */

const nl = '!!NL!!';
const nlPattern = new RegExp(nl, 'g');
const emailPattern = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;

function prettify(result, hrDiff, input) {
	const inspected = util.inspect(result, { depth: 0 })
		.replace(nlPattern, '\n')
		.replace(sensitivePattern(), '--removed--')
		.replace(emailPattern, '--removed--');
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