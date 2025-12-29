import path from 'path'
import { fileURLToPath } from 'url' // 导入转换工具
import alias from '@rollup/plugin-alias'
import typescript from '@rollup/plugin-typescript'
import deckyPlugin from '@decky/rollup'
import del from 'rollup-plugin-delete'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default deckyPlugin({
  plugins: [
    del({ targets: 'dist/*' }),
    alias({
      entries: [{ find: '@', replacement: path.resolve(__dirname, 'src') }],
    }),
    typescript({
      include: ['src/**/*.ts', 'src/**/*.tsx'],
    }),
  ],
})
