'use client'

import { useState, useEffect } from 'react'
import { getRobots, getAvatar, Robot, Avatar, addInventory, getInventory } from '@/lib/game-store'
import { toast } from 'sonner'
import { formatNumber } from '@/lib/formatters'

type BattleLog = {
  turn: number
  attacker: string
  defender: string
  damage: number
  isCrit: boolean
  message: string
}

export default function ArenaPage() {
  const [robots, setRobots] = useState<Robot[]>([])
  const [avatar, setAvatar] = useState<Avatar | null>(null)
  const [selectedRobotId, setSelectedRobotId] = useState<string | null>(null)
  
  const [opponent, setOpponent] = useState<Robot | null>(null)
  const [battleLogs, setBattleLogs] = useState<BattleLog[]>([])
  const [isBattling, setIsBattling] = useState(false)
  const [battleResult, setBattleResult] = useState<'WIN' | 'LOSS' | null>(null)

  useEffect(() => {
    setRobots(getRobots())
    setAvatar(getAvatar())
    generateOpponent()
  }, [])

  function generateOpponent() {
    // Generate a random opponent based on the player's level (or just random for now)
    const randomHp = Math.floor(Math.random() * 100) + 50
    const randomAtk = Math.floor(Math.random() * 15) + 5
    const randomDef = Math.floor(Math.random() * 10) + 2
    const randomSpd = Math.floor(Math.random() * 20) + 5

    setOpponent({
      id: 'bot_1',
      userId: 'system',
      name: `Rogue Drone #${Math.floor(Math.random() * 9999)}`,
      robotTypeKey: 'COMBAT',
      status: 'IDLE',
      level: 1,
      experience: 0,
      durability: 100,
      lifetimeWear: 0,
      upgradeProduction: 0,
      upgradeEfficiency: 0,
      upgradeEnergyCapacity: 0,
      upgradeDurability: 0,
      upgradeSpeed: 0,
      hp: randomHp,
      maxHp: randomHp,
      attack: randomAtk,
      defense: randomDef,
      speed: randomSpd,
      createdAt: new Date().toISOString()
    })
    setBattleLogs([])
    setBattleResult(null)
  }

  const selectedRobot = robots.find(r => r.id === selectedRobotId)

  async function startBattle() {
    if (!selectedRobot || !opponent) return
    if (selectedRobot.status !== 'IDLE') {
      toast.error('Selected robot is not IDLE!')
      return
    }

    setIsBattling(true)
    setBattleLogs([])
    setBattleResult(null)

    // Simulate Battle
    let p1Hp = selectedRobot.hp
    let p2Hp = opponent.hp
    let turn = 1
    const logs: BattleLog[] = []

    // Determine who goes first based on speed
    let p1Turn = selectedRobot.speed >= opponent.speed

    while (p1Hp > 0 && p2Hp > 0 && turn < 50) {
      const attacker = p1Turn ? selectedRobot : opponent
      const defender = p1Turn ? opponent : selectedRobot
      
      // Damage calculation: basic ATK - (DEF / 2)
      let damage = Math.max(1, Math.floor(attacker.attack - (defender.defense * 0.5)))
      
      // Critical hit chance (10%)
      const isCrit = Math.random() < 0.1
      if (isCrit) damage = Math.floor(damage * 1.5)

      // Variance +/- 10%
      const variance = 1 + (Math.random() * 0.2 - 0.1)
      damage = Math.floor(damage * variance)

      if (p1Turn) p2Hp -= damage
      else p1Hp -= damage

      logs.push({
        turn,
        attacker: attacker.name,
        defender: defender.name,
        damage,
        isCrit,
        message: `${attacker.name} attacks ${defender.name} for ${damage} damage! ${isCrit ? '(CRITICAL HIT)' : ''}`
      })

      turn++
      p1Turn = !p1Turn
    }

    // Playback logs slowly
    for (let i = 0; i < logs.length; i++) {
      await new Promise(r => setTimeout(r, 600))
      setBattleLogs(prev => [...prev, logs[i]])
    }

    const won = p1Hp > 0
    setBattleResult(won ? 'WIN' : 'LOSS')
    setIsBattling(false)

    if (won) {
      toast.success('Victory! Earned 50 Titanium and XP.')
      addInventory('TITANIUM', 50)
      // Todo: Add XP
    } else {
      toast.error('Defeat! Your robot took damage.')
    }
  }

  const idleRobots = robots.filter(r => r.status === 'IDLE' && r.durability > 0)

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Arena PvP (Simulation)</h1>
        <p className="page-subtitle">Test your robots against rogue drones</p>
      </div>

      <div className="grid-2">
        {/* Left Side: Setup */}
        <div>
          <div className="section-title">Select Your Fighter</div>
          <div className="card" style={{ marginBottom: 24 }}>
            {idleRobots.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No idle robots available. Repair or free them up.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {idleRobots.map(r => (
                  <button key={r.id}
                    onClick={() => !isBattling && setSelectedRobotId(r.id)}
                    style={{
                      width: '100%', display: 'flex', justifyContent: 'space-between', padding: '12px 16px',
                      background: selectedRobotId === r.id ? 'var(--accent-glow)' : 'var(--bg-elevated)',
                      border: selectedRobotId === r.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                      borderRadius: 8, cursor: isBattling ? 'not-allowed' : 'pointer', textAlign: 'left'
                    }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{r.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lvl {r.level} {r.robotTypeKey}</div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 12 }}>
                      <div>❤️ {r.hp}/{r.maxHp}</div>
                      <div>⚔️ {r.attack} 🛡️ {r.defense} ⚡ {r.speed}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="section-title">Opponent</div>
          {opponent && (
            <div className="card" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--color-danger)', fontSize: 18 }}>{opponent.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Lvl {opponent.level} {opponent.robotTypeKey}</div>
                </div>
                <div style={{ fontSize: 32 }}>👾</div>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 16, fontSize: 14 }}>
                <div>❤️ {opponent.hp} HP</div>
                <div>⚔️ {opponent.attack} ATK</div>
                <div>🛡️ {opponent.defense} DEF</div>
                <div>⚡ {opponent.speed} SPD</div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
            <button 
              className={`btn btn-full ${isBattling ? 'btn-secondary' : 'btn-primary'}`}
              disabled={!selectedRobot || isBattling}
              onClick={startBattle}
            >
              {isBattling ? 'BATTLE IN PROGRESS...' : '⚔️ START BATTLE'}
            </button>
            <button className="btn btn-secondary" disabled={isBattling} onClick={generateOpponent}>
              🔄 Find New Opponent
            </button>
          </div>
        </div>

        {/* Right Side: Battle Log */}
        <div>
          <div className="section-title">Battle Log</div>
          <div className="card" style={{ height: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8, background: '#0a0a0a' }}>
            {battleLogs.length === 0 && !isBattling && !battleResult && (
              <div style={{ margin: 'auto', color: 'var(--text-muted)' }}>Waiting for combat...</div>
            )}
            {battleLogs.map(log => (
              <div key={log.turn} style={{ 
                padding: '8px 12px', 
                borderRadius: 6,
                background: 'rgba(255,255,255,0.03)',
                borderLeft: log.attacker === selectedRobot?.name ? '3px solid var(--accent-primary)' : '3px solid var(--color-danger)',
                fontSize: 13
              }}>
                <span style={{ color: 'var(--text-muted)', marginRight: 8 }}>[Turn {log.turn}]</span>
                <span style={{ color: log.isCrit ? '#fbbf24' : 'inherit', fontWeight: log.isCrit ? 700 : 400 }}>
                  {log.message}
                </span>
              </div>
            ))}
            {battleResult && (
              <div className="animate-fade-in" style={{
                marginTop: 16, padding: 16, textAlign: 'center', borderRadius: 8, fontWeight: 700, fontSize: 24,
                background: battleResult === 'WIN' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                color: battleResult === 'WIN' ? 'var(--color-success)' : 'var(--color-danger)',
                border: battleResult === 'WIN' ? '2px solid rgba(34,197,94,0.3)' : '2px solid rgba(239,68,68,0.3)'
              }}>
                {battleResult === 'WIN' ? 'VICTORY!' : 'DEFEATED'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
