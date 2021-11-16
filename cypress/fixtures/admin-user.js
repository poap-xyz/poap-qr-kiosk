module.exports = {

	name: `Derpy McDerpface`,
	email: `derpy@mcderpface.com`,
	events: [
		{
			name: `Event ${ Math.random() }`,
			end: new Date( Date.now() + 1000 * 60 * 60 * 24 ).toISOString().slice(0, 10)
		},
		{
			name: `Event ${ Math.random() }`,
			end: new Date( Date.now() + 1000 * 60 * 60 * 48 ).toISOString().slice(0, 10)
		}
	]

}