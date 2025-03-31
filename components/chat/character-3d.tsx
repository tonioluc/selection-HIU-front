"use client"

import { useRef, useState } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls } from "@react-three/drei"

// Composant pour le personnage 3D simple
function SimpleCharacter({ color = "#8b5cf6", waving = true }) {
  const group = useRef()
  const [hovered, setHovered] = useState(false)

  // Animation de salutation
  useFrame((state) => {
    if (group.current && waving) {
      // Animation simple de salutation
      const t = state.clock.getElapsedTime()

      // Rotation du personnage
      group.current.rotation.y = Math.sin(t / 2) * 0.3 + Math.PI / 4

      // Faire bouger légèrement le personnage de haut en bas
      group.current.position.y = Math.sin(t * 2) * 0.05

      // Animation du bras (main) si le personnage fait coucou
      if (group.current.children[1]) {
        group.current.children[1].rotation.z = Math.sin(t * 5) * 0.5
        group.current.children[1].position.y = 0.6 + Math.sin(t * 5) * 0.05
      }
    }
  })

  return (
    <group
      ref={group}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
      scale={hovered ? [1.1, 1.1, 1.1] : [1, 1, 1]}
    >
      {/* Corps */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Main qui fait coucou */}
      <mesh position={[0.4, 0.6, 0]} rotation={[0, 0, 0.5]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Yeux */}
      <mesh position={[0.15, 0.2, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </mesh>

      <mesh position={[-0.15, 0.2, 0.4]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshStandardMaterial color="white" />
        <mesh position={[0, 0, 0.05]}>
          <sphereGeometry args={[0.04, 16, 16]} />
          <meshStandardMaterial color="black" />
        </mesh>
      </mesh>

      {/* Sourire */}
      <mesh position={[0, 0, 0.4]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.2, 0.05, 16, 16, Math.PI]} />
        <meshStandardMaterial color="black" />
      </mesh>
    </group>
  )
}

// Composant principal pour afficher le personnage 3D
export function Character3D({ color = "#8b5cf6", size = 200, waving = true }) {
  return (
    <div style={{ width: size, height: size }}>
      <Canvas camera={{ position: [0, 0, 2.5], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} />
        <pointLight position={[-10, -10, -10]} />
        <SimpleCharacter color={color} waving={waving} />
        <OrbitControls enableZoom={false} enablePan={false} />
      </Canvas>
    </div>
  )
}

