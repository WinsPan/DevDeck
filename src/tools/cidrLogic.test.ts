import { describe, expect, it } from 'vitest'
import { parseIpv4Cidr, splitIpv4Cidr } from './cidrLogic'

describe('IPv4 CIDR calculator', () => {
  it('calculates a private /24 network', () => {
    expect(parseIpv4Cidr('192.168.1.10/24')).toMatchObject({
      address: '192.168.1.10',
      network: '192.168.1.0',
      broadcast: '192.168.1.255',
      netmask: '255.255.255.0',
      firstHost: '192.168.1.1',
      lastHost: '192.168.1.254',
      totalAddresses: 256,
      usableHosts: 254,
      privateRange: true,
    })
  })

  it('handles /31 point-to-point ranges', () => {
    expect(parseIpv4Cidr('10.0.0.4/31')).toMatchObject({
      network: '10.0.0.4',
      broadcast: '10.0.0.5',
      firstHost: '10.0.0.4',
      lastHost: '10.0.0.5',
      usableHosts: 2,
    })
  })

  it('splits a network into smaller subnets', () => {
    expect(splitIpv4Cidr('192.168.1.0/24', 26)).toEqual([
      '192.168.1.0/26',
      '192.168.1.64/26',
      '192.168.1.128/26',
      '192.168.1.192/26',
    ])
  })

  it('rejects invalid addresses and prefixes', () => {
    expect(() => parseIpv4Cidr('192.168.1.999/24')).toThrow()
    expect(() => parseIpv4Cidr('192.168.1.1/33')).toThrow()
  })
})
