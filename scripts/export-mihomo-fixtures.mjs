import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';
import contract from '../src/config/mihomo-contract.json' with { type: 'json' };

const root = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const output = path.join(root, '.tmp/mihomo-contract/fixtures');
fs.mkdirSync(output, { recursive: true });
const uuid = '00000000-0000-0000-0000-000000000001';
const base = { server: 'example.invalid', port: 443 };
const nodes = [
    { ...base, name: 'SS', type: 'ss', cipher: 'aes-128-gcm', password: 'synthetic', udp: true },
    { ...base, name: 'VMess', type: 'vmess', uuid, alterId: 0, cipher: 'auto', tls: true, alpn: ['h2'], 'client-fingerprint': 'firefox', network: 'ws', 'ws-opts': { path: '/test', headers: { Host: 'example.invalid' } } },
    { ...base, name: 'VLESS', type: 'vless', uuid, tls: true, network: 'http', 'http-opts': { path: ['/test'], headers: { Host: ['example.invalid'] } }, alpn: ['h2'], tfo: true },
    { ...base, name: 'VLESS-XHTTP', type: 'vless', uuid, tls: true, network: 'xhttp', 'xhttp-opts': { path: '/test', mode: 'auto', host: 'example.invalid' } },
    { ...base, name: 'Trojan', type: 'trojan', password: 'synthetic', alpn: ['h2'], 'client-fingerprint': 'chrome', network: 'grpc', 'grpc-opts': { 'grpc-service-name': 'test' } },
    { ...base, name: 'HY1', type: 'hysteria', 'auth-str': 'synthetic', up: '10 Mbps', down: '20 Mbps', alpn: ['hysteria'] },
    { ...base, name: 'HY2', type: 'hysteria2', password: 'synthetic', ports: '443,8443', 'hop-interval': '15-30', alpn: ['h3'], 'bbr-profile': 'conservative', 'handshake-timeout': 10 },
    { ...base, name: 'TUIC', type: 'tuic', uuid, password: 'synthetic', 'congestion-controller': 'bbr', alpn: ['h3'] },
    { ...base, name: 'AnyTLS', type: 'anytls', password: 'synthetic', 'idle-session-timeout': 30, sni: 'example.invalid' },
];
const builder = new ClashConfigBuilder(yaml.dump({ proxies: nodes }), 'minimal', [], null, 'zh-CN', `mihomo/${contract.version}`);
const generated = await builder.build();
fs.writeFileSync(path.join(output, 'generated.yaml'), generated);
fs.writeFileSync(path.join(output, 'expected-nodes.json'), JSON.stringify(nodes, null, 2) + '\n');
fs.writeFileSync(path.join(output, 'contract.json'), JSON.stringify(contract, null, 2) + '\n');
console.log(`Generated ${nodes.length} synthetic nodes for ${contract.contract}: ${output}`);
