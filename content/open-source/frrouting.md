---
title: FRRouting
subtitle: BFD daemon (bfdd)
mark: "◉"
tags: 3 merged, 3 open
order: 0
---

Found while building xdp-bfd against FRR's distributed BFD dataplane. Six bugs reported in total, each with a reproducer that needed no dataplane implementation.

- Fixed silent and permanent loss of BFD sessions when the initial dataplane registration overflowed the 8KB output buffer.
- Implemented RFC 5880 echo interval negotiation for offloaded sessions.
