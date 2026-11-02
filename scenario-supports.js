// Global support IDs; independent of translated display names. See docs/deck-scoring.md.
export const scenarioSupportIds = {"URA": [], "Aoharu": [10008, 10015, 10020, 10044, 10060, 20016, 30019, 30023, 30034, 30036, 30053, 30078, 30098, 30100], "GL": [10002, 10032, 10036, 10039, 10083, 20009, 20012, 20045, 30002, 30017, 30052, 30059, 30062, 30066, 30076, 30101, 30121]};
// Planning heuristic, not an observed event probability or a turn simulation.
export const recoveryUtilization = cards => 1 / (1 + .5 * cards.filter(c=>c.type===4).length);
