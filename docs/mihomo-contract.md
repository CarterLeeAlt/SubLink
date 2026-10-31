# Mihomo output contract

## Target

The `/clash` output targets **Mihomo v1.19.33**, upstream commit `3f27ef39f8c96bbfbc8b0b9bb10f5c9ef60149d8`. `src/config/mihomo-contract.json` declares `mihomo-v1.19.33-common`. YAML and response headers carry the version/contract. User-Agent does not select an older output dialect.

The reference is tagged source and the executable, not an unpinned documentation branch. Matching clients validate the complete output against that version. YAML parsing alone does not prove compatibility.

## Supported paths

- Native Mihomo YAML nodes retain their fields without the cross-format intermediate model, including current TLS, Reality, transport and protocol-specific fields. Provider-only configurations are retained; unsupported native protocols are rejected.
- URI/cross-format conversion covers SS, VMess, VLESS, Trojan, Hysteria2, TUIC and AnyTLS. Hysteria 1 URI conversion is rejected; supply native Hysteria 1 YAML instead of renaming the protocol to Hysteria2.
- VLESS XHTTP URIs preserve host/path/mode and mapped extra fields: `headers`, `noGRPCHeader`, `xPaddingBytes`, `scMaxEachPostBytes`, `scMinPostsIntervalMs`. Other extra fields require native YAML, not silent loss. Native XHTTP options are retained.
- Supported URI paths retain ALPN, explicit certificate verification flags and client fingerprints. Unsupported transports or Hysteria2 URI options fail explicitly.
- Empty/invalid sources are errors, not direct-only configurations. Failed upstream fetching cannot be hidden behind a normal-looking selector.
- Auto-generated proxy providers preserve the initial User-Agent in download headers; the consumer must still verify actual provider loading.
- MRS domain/ipcidr rules and generated DNS are validated as complete output, not removed to pass tests.

## Verification

`npm test` covers field fidelity, input errors, empty sources, provider identity, XHTTP and target selection, alongside other output formats. `npm run test:mihomo:fixtures` generates a synthetic nine-node configuration and expected nodes under `.tmp/mihomo-contract/fixtures/` using the production builder.

The paired client downloads through a controlled redirect, parses, enhances, compares fields and loads the complete configuration in the pinned core. This does not prove an arbitrary remote server is reachable. Online deployment results and local source results are reported separately.

Changing the target requires deliberate parameter-diff review and rerunning generator/client/real-core tests before changing the declaration. There is no floating `latest` compatibility claim.

## Paired local verification

The local verification against the paired Astra source passed 304 generator tests, complete nine-node configuration loading, and an isolated real VLESS/XHTTP subscription check. The remote worker was not deployed. Source baselines are Sublink `cd476aca` and Astra `61e2e19`, both with uncommitted modifications; exact source fingerprints and limits are recorded in the paired client's `docs/archive/mihomo-v1.19.33-subscription-verification.md` and package `build-info.json`, rather than claiming those baselines are the repaired commits.
