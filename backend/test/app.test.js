// Author: Naveen Duhan
const assert = require('node:assert/strict');
const test = require('node:test');

const app = require('../index');

async function withServer(callback) {
    const server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));
    try {
        const { port } = server.address();
        await callback(`http://127.0.0.1:${port}`);
    } finally {
        await new Promise(resolve => server.close(resolve));
    }
}

test('health endpoint reports a healthy service', async () => {
    await withServer(async baseUrl => {
        const response = await fetch(`${baseUrl}/api/jobs/health`);
        assert.equal(response.status, 200);
        assert.equal((await response.json()).status, 'healthy');
    });
});

test('secondary-structure endpoint rejects traversal-like accessions', async () => {
    await withServer(async baseUrl => {
        const query = new URLSearchParams({ namer: 'valid-job', acc_extract: '../../etc/passwd' });
        const response = await fetch(`${baseUrl}/api/secstruct?${query}`);
        assert.equal(response.status, 400);
    });
});
