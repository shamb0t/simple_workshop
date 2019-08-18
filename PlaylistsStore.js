import { observable } from 'mobx'
import Identities from 'orbit-db-identity-provider'
import OrbitDB from 'orbit-db'

class PlaylistsStore {
  @observable isOnline = false
  @observable playlists = []
  @observable currentPlaylist = {}

  constructor() {
    this._ipfs = null
    this.odb = null
    this.feed = null
  }

  async connect(ipfs, options = {}) {
    this._ipfs = ipfs
    const identity = options.identity || await Identities.createIdentity({ id: 'user' })
    this.odb = await OrbitDB.createInstance(ipfs, { identity, directory: './odb'})
    await this.loadPlaylists()
    console.log(this.feed.all)
    this.isOnline = true
  }

  async loadPlaylists() {
    this.feed = await this.odb.feed(this.odb.identity.id + '/playlists')
    this.feed.events.on('write', (address, entry, heads) => {
      console.log("added", entry)
      switch (entry.payload.op) {
        case 'ADD':
          this.playlists.push({
            hash: entry.hash,
            name: entry.payload.value.name,
            address: entry.payload.value.address
          })
          break
        case 'DEL':
          const filtered = this.playlists.filter(x => x.hash !== entry.payload.value)
          this.playlists = filtered
          break
        default:
          console.log("could not recognize op")
      }
    })

    await this.feed.load()

    this.feed.all.map(entry => {
      this.playlists.push({
        hash: entry.hash,
        name: entry.payload.value.name,
        address: entry.payload.value.address
      })
    })
  }

  async createNewPlaylist(name) {
    const playlist = await this.odb.feed(name, { accessController: { type: 'orbitdb', write: [this.odb.identity.id]}})
    const p = {
      name,
      address: playlist.address.toString()
    }

    const hash = await this.feed.add(p)
    return hash
  }

  async joinPlaylist (address) {
    if (this.odb) {
      const playlist = this.odb.stores[address] || await this.odb.open(address)
      await playlist.load()
      this.currentPlaylist = playlist
    }
  }

  async deletePlaylist(hash) {
    await this.feed.del(hash)
  }

  async addToPlaylist (address, data) {
    const feed = this.odb.stores[address] || await this.odb.open(address)
    if (feed) {
      const hash = await feed.add(data)
      return feed.get(hash)
    }
    return
  }

  async addFile (address, source) {
    if (!source || !source.filename) {
      throw new Error('Filename not specified')
    }
    const isBuffer = source.buffer && source.filename
    const name = source.filename.split('/').pop()
    const size = source.meta && source.meta.size ? source.meta.size : 0

    const result = await this._ipfs.add(Buffer.from(source.buffer))
    const hash = result[0].hash

    console.log("upload", hash)

    // Create a post
    const data = {
      content: hash,
      meta: Object.assign(
        {
          from: this.odb.identity.id,
          type: 'file',
          ts: new Date().getTime()
        },
        { size, name },
        source.meta || {}
      )
    }

    return this.addToPlaylist(address, data)
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

  async sharePlaylist (address, peerId) {
    // add peer to ac
    // send message to peer
    if (!this.odb) return false
    const feed = this.odb.stores[address] || await this.odb.open(address)
    await feed.access.grant('write', peerId)
    console.log(address, peer)
    return true
    // const channel = await Channel.open(this._ipfs, peer)
    // // Explicitly wait for peers to connect
    // console.log("Channel", channel)
    // await channel.connect()
    // // Send message on the channel
    // const thing = await channel.send('Hello World!')
    // console.log(thing)
    // // Process messages from the other peer
    // channel.on('message', (message) => {
    //   console.log('Message from', message.from, message)
    // })
  }
}

const store = window.store = new PlaylistsStore

// store.load()

export default store
