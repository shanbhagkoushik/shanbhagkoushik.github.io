---
title: xdp-bfd
subtitle: Line-card-style BFD offload for plain Linux
date: 2026-07-01
mark: "↗"
tags: C, XDP, eBPF, libbpf, FRRouting
url: https://github.com/shanbhagkoushik/xdp-bfd
order: 0
---

A fast-path BFD engine for plain Linux. Parsing, liveness detection, and transmission run in the kernel so a dead peer is still detected when userspace is fully starved of CPU.

- Dual-stack IPv4 and IPv6 on one shared session map.
- RFC 5880 echo mode and RFC 5883 multihop.
- Every performance claim is backed by a packet capture.
