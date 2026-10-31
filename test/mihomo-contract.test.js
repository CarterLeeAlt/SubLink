import { describe, it, expect } from 'vitest';
import yaml from 'js-yaml';
import { ClashConfigBuilder } from '../src/builders/ClashConfigBuilder.js';

const builder = input => new ClashConfigBuilder(input, ['Non-China'], [], null, 'zh-CN', 'clash-astra/1.8.2 mihomo/v1.19.33');
const native = {
    name: 'Synthetic VLESS', type: 'vless', server: 'example.invalid', port: 443,
    uuid: '00000000-0000-0000-0000-000000000001', tls: true,
    network: 'http', 'http-opts': { method: 'GET', path: ['/t'], headers: { Host: ['example.invalid'] } },
    alpn: ['h2'], 'client-fingerprint': 'firefox', tfo: true, 'packet-encoding': 'xudp',
    'ech-opts': { enable: false },
};

describe('Mihomo v1.19.33 generation contract', () => {
    it('preserves native nodes without a lossy intermediate representation', async () => {
        const output = yaml.load(await builder(yaml.dump({ proxies: [native] })).build());
        expect(output.proxies).toEqual([native]);
    });
    it('does not silently turn Hysteria 1 into Hysteria 2', async () => {
        const hy = { name: 'HY1', type: 'hysteria', server: 'example.invalid', port: 443, 'auth-str': 'synthetic', up: '10 Mbps', down: '20 Mbps', alpn: ['hysteria'] };
        const output = yaml.load(await builder(yaml.dump({ proxies: [hy] })).build());
        expect(output.proxies[0]).toEqual(hy);
    });
    it('rejects empty input and invalid protocol sources instead of a direct-only success', async () => {
        await expect(builder('not-a-subscription').build()).rejects.toThrow();
        await expect(builder('proxies: []').build()).rejects.toThrow();
    });
    it('retains native provider-only configuration', async () => {
        const provider = { type: 'inline', payload: [{ name: 'Local', type: 'socks5', server: '127.0.0.1', port: 9 }] };
        const output = yaml.load(await builder(yaml.dump({ 'proxy-providers': { p: provider } })).build());
        expect(output['proxy-providers'].p).toEqual(provider);
    });
    it('does not emit unsupported native protocols', async () => {
        await expect(builder('proxies: [{name: bad, type: fictional, server: example.invalid, port: 443}]').build()).rejects.toThrow();
    });
    it('preserves VMess URI ALPN and client fingerprint', async () => {
        const value = { v: '2', ps: 'VM', add: 'example.invalid', port: 443, id: native.uuid, aid: 0, net: 'tcp', tls: 'tls', alpn: 'h2,http/1.1', fp: 'firefox' };
        const output = yaml.load(await builder(`vmess://${btoa(JSON.stringify(value))}`).build());
        expect(output.proxies[0].alpn).toEqual(['h2', 'http/1.1']);
        expect(output.proxies[0]['client-fingerprint']).toBe('firefox');
    });
    it('requires an explicit supported Hysteria1 path instead of protocol aliasing', async () => {
        await expect(builder('hysteria://synthetic@example.invalid:443?upmbps=10&downmbps=20#HY1').build()).rejects.toThrow(/Hysteria 1|hysteria/i);
    });
    it('keeps provider download identity consistent with generation', () => {
        const item = builder('');
        item.providerUrls = ['https://example.invalid/sub'];
        const provider = Object.values(item.generateProxyProviders())[0];
        expect(provider.header['User-Agent']).toEqual([item.userAgent]);
    });
    it('maps the common VLESS XHTTP URI fields without losing host, path or mode', async () => {
        const output = yaml.load(await builder(`vless://${native.uuid}@example.invalid:443?type=xhttp&security=tls&host=example.invalid&path=%2Ftest&mode=auto&alpn=h2&fp=firefox#XHTTP`).build());
        expect(output.proxies[0]['xhttp-opts']).toEqual({ host: 'example.invalid', path: '/test', mode: 'auto' });
        expect(output.proxies[0].alpn).toEqual(['h2']);
        expect(output.proxies[0]['client-fingerprint']).toBe('firefox');
    });
});
