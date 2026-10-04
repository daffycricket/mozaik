# Synthèse du run

- run_id=20261004-100537-umans-umans-deepseek-v4.1-flash-payg
- branch=run/20261004-100537-umans-umans-deepseek-v4.1-flash-payg
- context_commit=e736bc089767a2d1a42f9add6d4a4a92d25ac1ae
- project=miro-20261004-100537-umans-umans-deepseek-v4-1-flash-payg
- start=2026-10-04T08:05:41+00:00
- model=umans/umans-deepseek-v4.1-flash
- end=2026-10-04T09:25:32+00:00
- sessions=3
- stop_reason=nombre maximal de sessions atteint (3)

## Consommation

| Session | Début | Durée (s) | Exit | Ticket | Tokens in | Tokens out | Reasoning | Cache lu | Cache écrit | Coût (USD) |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 2026-10-04T08:05:41+00:00 | 1350 | 0 | T-001 | 124590 | 20475 | 42137 | 6642232 | 0 | 0.2422 |
| 2 | 2026-10-04T08:28:15+00:00 | 2280 | 0 | T-002 | 167823 | 37387 | 49736 | 16933230 | 0 | 0.5516 |
| 3 | 2026-10-04T09:06:26+00:00 | 1140 | 0 | F01-S1 | 109766 | 14568 | 29382 | 6186050 | 0 | 0.216 |
| **Total** | | 4770 | | | 402179 | 72430 | 121255 | 29761512 | 0 | 1.0098 |

Coûts calculés par OpenCode à partir des tarifs connus du modèle (0 si le tarif n'est pas renseigné dans `opencode.json`).

## Garde-fous et contrôles

| Type | Ticket | Résumé | À revoir |
|---|---|---|---|
| contrôle | T-001 | Commit(s) non conforme(s) à process/git.md : ba8832c « docs(plan): T-001#0 plan 3 steps » (trailer Refs absent, trailer Plan-Step absent). | oui |
| contrôle | T-001 | Vérification indépendante de main @ eaddd6b réussie : lint, typecheck, test:unit. Scripts absents, non vérifiés : test:int, test:e2e, ac:check. | non |
| contrôle | T-002 | Commit(s) non conforme(s) à process/git.md : 3e504e0 « docs(plan): T-002#0 plan 6 steps » (trailer Refs absent, trailer Plan-Step absent). | oui |
| contrôle | T-002 | Test hérité modifié : tooling/commit-msg.test.ts, modification non justifiée (aucune spec modifiée dans la session) ; 1 test(s) disparu(s) : « [T-001-AC4] accepts an n/a report for the T-001 bo ». | oui |
| contrôle | T-002 | Rejeu : l'ancienne version de tooling/commit-msg.test.ts échoue sur le nouveau code alors qu'aucune spec n'a changé. Régression probablement masquée en modifiant le test. | oui |
| contrôle | T-002 | Vérification indépendante de main @ bc0d437 réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 96.36 %, branches 85 %). | non |
| contrôle | F01-S1 | Vérification indépendante de main @ 2842500 réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 91 %, branches 89.65 %). | non |
| run | RUN | Fin du run après 3 session(s) : nombre maximal de sessions atteint (3). | oui |

Totaux : contrôle 7, run 1.

## Tickets (backlog de main)
- done : 3
- in-progress : 0
- blocked : 0
- todo : 30

## Journal
- entrées à revoir : 12

## Git
- commits sur main : 24
- branche publiée : main @ 14b9c04

## Sessions
```
== session 1 2026-10-04T08:05:41+00:00 main=fc879d1
   exit=0 durée=1350s ticket=T-001 tokens in=124590 out=20475 reasoning=42137 cache_read=6642232 cache_write=0 coût=0.2422 USD
   vérification indépendante : réussie
   journal : 2 événement(s) (contrôle, contrôle)
   publié : run/20261004-100537-umans-umans-deepseek-v4.1-flash-payg @ dc43bab
== session 2 2026-10-04T08:28:15+00:00 main=dc43bab
   exit=0 durée=2280s ticket=T-002 tokens in=167823 out=37387 reasoning=49736 cache_read=16933230 cache_write=0 coût=0.5516 USD
   vérification indépendante : réussie
   journal : 4 événement(s) (contrôle, contrôle, contrôle, contrôle)
   publié : run/20261004-100537-umans-umans-deepseek-v4.1-flash-payg @ c307194
== session 3 2026-10-04T09:06:26+00:00 main=c307194
   exit=0 durée=1140s ticket=F01-S1 tokens in=109766 out=14568 reasoning=29382 cache_read=6186050 cache_write=0 coût=0.216 USD
   vérification indépendante : réussie
   journal : 1 événement(s) (contrôle)
   publié : run/20261004-100537-umans-umans-deepseek-v4.1-flash-payg @ 14b9c04
Arrêt : nombre maximal de sessions atteint (3)
   journal : 1 événement(s) (run)
```

## opencode stats
```
┌────────────────────────────────────────────────────────┐
│                       OVERVIEW                         │
├────────────────────────────────────────────────────────┤
│Sessions                                              3 │
│Messages                                            314 │
│Days                                                  1 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                    COST & TOKENS                       │
├────────────────────────────────────────────────────────┤
│Total Cost                                        $1.01 │
│Avg Cost/Day                                      $1.01 │
│Avg Tokens/Session                                10.1M │
│Median Tokens/Session                              6.8M │
│Input                                            402.2K │
│Output                                            72.4K │
│Cache Read                                        29.8M │
│Cache Write                                           0 │
└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      MODEL USAGE                       │
├────────────────────────────────────────────────────────┤
│ umans/umans-deepseek-v4.1-flash                        │
│  Messages                                          311 │
│  Input Tokens                                   402.2K │
│  Output Tokens                                  193.7K │
│  Cache Read                                      29.8M │
│  Cache Write                                         0 │
│  Cost                                          $1.0099 │
├────────────────────────────────────────────────────────┤
[1A└────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────┐
│                      TOOL USAGE                        │
├────────────────────────────────────────────────────────┤
│ bash               ████████████████████ 149 (34.3%)    │
│ read               ███████████████      119 (27.4%)    │
│ write              ████████████          92 (21.2%)    │
│ edit               █████████             72 (16.6%)    │
│ todowrite          █                      2 ( 0.5%)    │
└────────────────────────────────────────────────────────┘

```
