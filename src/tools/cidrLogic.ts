export interface Ipv4CidrResult {
  input: string
  address: string
  prefix: number
  netmask: string
  wildcard: string
  network: string
  broadcast: string
  firstHost: string
  lastHost: string
  totalAddresses: number
  usableHosts: number
  binary: string
  privateRange: boolean
}

export function parseIpv4Cidr(input: string): Ipv4CidrResult {
  const [addressPart, prefixPart = '32'] = input.trim().split('/')
  const octets = addressPart.split('.').map(Number)
  const prefix = Number(prefixPart)
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value) || value < 0 || value > 255)) throw new Error('请输入有效的 IPv4 地址，例如 192.168.1.10/24')
  if (!Number.isInteger(prefix) || prefix < 0 || prefix > 32) throw new Error('CIDR 前缀必须在 0 到 32 之间')

  const address = octetsToUint(octets)
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0
  const wildcard = (~mask) >>> 0
  const network = (address & mask) >>> 0
  const broadcast = (network | wildcard) >>> 0
  const totalAddresses = 2 ** (32 - prefix)
  const usableHosts = prefix >= 31 ? totalAddresses : Math.max(0, totalAddresses - 2)
  const firstHost = prefix >= 31 ? network : network + 1
  const lastHost = prefix >= 31 ? broadcast : broadcast - 1
  const privateRange =
    (address >= octetsToUint([10, 0, 0, 0]) && address <= octetsToUint([10, 255, 255, 255])) ||
    (address >= octetsToUint([172, 16, 0, 0]) && address <= octetsToUint([172, 31, 255, 255])) ||
    (address >= octetsToUint([192, 168, 0, 0]) && address <= octetsToUint([192, 168, 255, 255]))

  return {
    input,
    address: uintToIpv4(address),
    prefix,
    netmask: uintToIpv4(mask),
    wildcard: uintToIpv4(wildcard),
    network: uintToIpv4(network),
    broadcast: uintToIpv4(broadcast),
    firstHost: uintToIpv4(firstHost),
    lastHost: uintToIpv4(lastHost),
    totalAddresses,
    usableHosts,
    binary: octets.map((value) => value.toString(2).padStart(8, '0')).join('.'),
    privateRange,
  }
}

function octetsToUint(octets: number[]) {
  return (((octets[0] << 24) >>> 0) + (octets[1] << 16) + (octets[2] << 8) + octets[3]) >>> 0
}

function uintToIpv4(value: number) {
  return [value >>> 24, (value >>> 16) & 255, (value >>> 8) & 255, value & 255].join('.')
}

export function splitIpv4Cidr(input: string, newPrefix: number, limit = 256) {
  const base = parseIpv4Cidr(input)
  if (!Number.isInteger(newPrefix) || newPrefix <= base.prefix || newPrefix > 32) throw new Error(`子网前缀必须大于 /${base.prefix} 且不超过 /32`)
  const count = 2 ** (newPrefix - base.prefix)
  if (count > limit) throw new Error(`将产生 ${count.toLocaleString()} 个子网，预览上限为 ${limit}`)
  const networkValue = octetsToUint(base.network.split('.').map(Number))
  const blockSize = 2 ** (32 - newPrefix)
  return Array.from({ length: count }, (_, index) => `${uintToIpv4((networkValue + index * blockSize) >>> 0)}/${newPrefix}`)
}
