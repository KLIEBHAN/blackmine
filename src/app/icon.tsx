import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const size = {
  width: 32,
  height: 32,
}
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'transparent',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            background: 'linear-gradient(to bottom right, #1a1a1a, #000000)',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #333',
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          }}
        >
          <div
            style={{
              width: '14px',
              height: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              transform: 'rotate(45deg)',
              boxShadow: '0 0 4px rgba(59, 130, 246, 0.5)',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
