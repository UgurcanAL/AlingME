import { config } from './config.js';
import { openDb } from './db.js';
import { InventoryAgent } from './agents/inventoryAgent.js';
import { createProvider } from './providers/awardProvider.js';
import { Notifier, buildChannels } from './notify/notifier.js';
import { createApi } from './api/server.js';

const db = openDb();
const provider = createProvider(config);
const agent = new InventoryAgent({ db, provider, config });
const notifier = new Notifier({ db, channels: buildChannels(config) });

agent.start((alerts) => notifier.deliver(alerts));

const server = createApi({ db, agent });
server.listen(config.port, () => {
  console.log(`Pusula Radar pilotu :${config.port} · saglayici=${config.provider.kind} · tarama=${config.scan.intervalMs}ms`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    agent.stop();
    server.close(() => { db.close(); process.exit(0); });
  });
}
