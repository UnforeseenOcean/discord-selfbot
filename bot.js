const Discord = require('discord.js');
const client = new Discord.Client();
const util = require('util');
const escapeRegex = require('escape-string-regexp');

const cfg = require('./conf');

client.on('ready', () => {
	console.log(`Connected to Discord as ${client.user.username} on ${client.guilds.size} guilds with ${client.channels.size} channels.`);
});

client.on('message', message => {
	if (message.author.id != client.user.id) return;
	if (message.content.startsWith(cfg.prefix)) {
		setTimeout(function() {
		const cmd = message.content.split(' ')[0].slice(cfg.prefix.length);
		const params = message.content.replace(cfg.prefix + cmd + ' ', '');

		switch (cmd) {
			case 'ping':
				message.edit(`pong \`${Date.now()-message.timestamp-500}ms\``);
				break;
			case 'game':
				client.user.setStatus('online', params);
				message.edit(`Now currently playing \`${params}\``).then(function () {
					setTimeout(d => message.delete(), 5000);
				});
				break;
			case 'eval':
				try {
					var code = message.content.replace(cfg.prefix + cmd + ' ', '');
					const hrStart = process.hrtime();
					var lastResult = eval(code);
					var hrDiff = process.hrtime(hrStart);
					message.edit(prettify(lastResult, hrDiff, code));

				} catch (err) {
					message.edit(`__INPUT__ \`\`\`javascript\n${code}\`\`\`\n__OUTPUT__\`\`\`apache\n${err}\`\`\``);
				}
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
	if (input) {
		return `__INPUT__ \`\`\`javascript\n${input}\`\`\`\n__OUTPUT__ \`\`\`javascript\n${inspected}\`\`\`\n _\`Executed in in ${time}ms.\`_`;

	} else if (!input) {
		return `Callback executed after ${time} \`\`\`javascript\n${inspected}\`\`\``;
	}
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