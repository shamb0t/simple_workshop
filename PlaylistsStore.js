import { observable } from 'mobx'
import { EventEmitter } from 'events'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'
import PubSub from  'orbit-db-pubsub'
const Channel = require('ipfs-pubsub-1on1')

class PlaylistsStore {
  @observable playlists = []
  @observable peers = []
  @observable isOnline = false
  constructor() {
    this._ipfs = null
    this.odb = null
    this._identity = null
    this._peers = null
    this.events = new EventEmitter()
  }

  async connect(ipfs) {
    this._ipfs = ipfs
    const { id } = await ipfs.id()
    this.ipfsId = id
    const identity = await Identities.createIdentity({ id: 'fry' })
    this._identity = identity
    this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
    this.isOnline = true
    this._peers = new PubSub(this._ipfs, this.ipfsId)
    await this._peers.subscribe('odb-app-users', this._onMessage.bind(this), this._onNewPeer.bind(this))
    // this.events.emit("connected")
    // this._ipfs.libp2p.on('peer:connect', peerInfo => {
    //   console.log("HEY HEY CNNECTING", peerInfo)
    //   this.events.emit('peer:connect', pe'odb-app-users'erInfo)
    // })
    await this._peers.publish('odb-app-users', { id: this.odb.identity.id})
    console.log("CONNECTING")
  }

  async _onMessage (address, heads) {
    console.log("message")
    console.log(address, heads)
  }

  async _onNewPeer (topic, peer) {
    this.peers.push(peer)
    console.log(topic, peer)
  }

  load(key = 'playlists') {
    this.playlists = JSON.parse(localStorage.getItem(key)) || []
  }

  save(key = 'playlists') {
    localStorage.setItem(key, JSON.stringify(this.playlists))
  }

  deletePlaylist(name) {
    const filtered = this.playlists.filter(x => x.name !== name)
    this.playlists = filtered
    this.save()
  }

  async createNewPlaylist(name) {
    const playlist = await this.odb.feed(name, { accessController: { type: 'orbitdb', write: [this.odb.identity.id]}})
    const p = {
      name,
      address: playlist.address.toString()
    }

    this.playlists.push(p)
    this.save()
    return name
  }

  async openPlaylist (address) {
    if (!this.odb) return []
    const playlist = this.odb.stores[address] || await this.odb.open(address)
    await playlist.load()
    return playlist.all.map(p => ({ hash: p.hash, name: p.payload.value.name, data: p.payload.value }))
  }

  async joinPlaylist (address) {
    if (!this.odb) return null
    const playlist = this.odb.stores[address] || await this.odb.open(address)
    await playlist.load()
    return playlist
  }

  async addFile (address, source) {
  if (!source || (!source.filename && !source.directory)) {
    throw new Error('Filename or directory not specified')
  }

  async function _addToIpfsJs (data) {
    const result = await this._ipfs.add(Buffer.from(data))
    const isDirectory = false
    const hash = result[0].hash
    return { hash, isDirectory }
  }

  const isBuffer = source.buffer && source.filename
  const name = source.directory
    ? source.directory.split('/').pop()
    : source.filename.split('/').pop()
  const size = source.meta && source.meta.size ? source.meta.size : 0

  let addToIpfs

  addToIpfs = _addToIpfsJs.bind(this, source.buffer)

  const upload = await addToIpfs()
  console.log("upload", upload)

  // Create a post
  const data = {
    content: upload.hash,
    meta: Object.assign(
      {
        from: this._identity.id,
        type: upload.isDirectory ? 'directory' : 'file',
        ts: new Date().getTime()
      },
      { size, name },
      source.meta || {}
    )
  }

  return this.addToPlaylist(address, data)
}

  async addToPlaylist (address, data) {
    const feed = this.odb.stores[address] || await this.odb.open(address)
    if (feed) {
      const hash = await feed.add(data)
      const thing = await feed.get(hash)
      return thing
    }
    return
  }

  async _sendFile (file, address) {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = async event => {
        const f = await this.addFile(address,
          {
            filename: file.name,
            buffer: event.target.result,
            meta: { mimeType: file.type, size: file.size }
          })
        resolve(f)
      }
      reader.readAsArrayBuffer(file)
    })
  }

  sendFiles (files, address) {
    const promises = []
    for (let i = 0; i < files.length; i++) {
      promises.push(this._sendFile(files[i], address))
    }
    return Promise.all(promises)
  }

  async sharePlaylist (address, peer) {
    // add peer to ac
    // send message to peer
    // if (!this.odb) return false
    // const feed = this.odb.stores[address] || await this.odb.open(address)
    // await feed.access.grant('write', peer)
    // return true
    console.log(address, peer)
    const channel = await Channel.open(this._ipfs, peer)
    // Explicitly wait for peers to connect
    console.log("Channel", channel)
    await channel.connect()
    // Send message on the channel
    const thing = await channel.send('Hello World!')
    console.log(thing)
    // Process messages from the other peer
    channel.on('message', (message) => {
      console.log('Message from', message.from, message)
    })
  }
}

const store = window.store = new PlaylistsStore

store.load()

export default store
