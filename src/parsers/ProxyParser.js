import { parseShadowsocks } from './protocols/shadowsocksParser.js';
import { parseVmess } from './protocols/vmessParser.js';
import { parseVless } from './protocols/vlessParser.js';
import { parseHysteria2 } from './protocols/hysteria2Parser.js';
import { parseTrojan } from './protocols/trojanParser.js';
import { parseTuic } from './protocols/tuicParser.js';
import { parseAnytls } from './protocols/anytlsParser.js';
import { fetchSubscription } from './subscription/httpSubscriptionFetcher.js';
import { InvalidConfigError } from '../services/errors.js';

const protocolParsers = {
    ss: parseShadowsocks,
    vmess: parseVmess,
    vless: parseVless,
    hysteria2: parseHysteria2,
    hy2: parseHysteria2,
    http: fetchSubscription,
    https: fetchSubscription,
    trojan: parseTrojan,
    tuic: parseTuic,
    anytls: parseAnytls
};

export class ProxyParser {
    static async parse(url, userAgent, options = {}) {
        if (!url || typeof url !== 'string') {
            return undefined;
        }
        const trimmed = url.trim();
        const type = trimmed.split('://')[0].toLowerCase();
        if (type === 'hysteria') throw new InvalidConfigError('Hysteria 1 URI conversion is not supported; supply native Mihomo YAML instead of converting it to Hysteria 2');
        const parser = protocolParsers[type];
        if (!parser) {
            return undefined;
        }
        const result = await parser(trimmed, userAgent);
        if (options.target === 'mihomo' && result?.type === 'hysteria2' && (result.recv_window_conn !== undefined || result.fast_open !== undefined)) {
            throw new InvalidConfigError('Hysteria2 recv_window_conn/fast-open URI options are not supported by the pinned Mihomo contract; use native current-format options');
        }
        const transports = type === 'vless' ? ['tcp', 'ws', 'grpc', 'http', 'h2', 'xhttp'] : ['tcp', 'ws', 'grpc', 'http', 'h2'];
        if (options.target === 'mihomo' && result?.transport?.type && !transports.includes(result.transport.type)) {
            throw new InvalidConfigError(`Unsupported URI transport: ${result.transport.type}; use native Mihomo YAML`);
        }
        return result;
    }
}
