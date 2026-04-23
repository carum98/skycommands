import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
	plugins: [
		vue(),
	],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, 'app'),
			'@utils': path.resolve(__dirname, 'app/utils'),
			'@composables': path.resolve(__dirname, 'app/composables'),
			'@styles': path.resolve(__dirname, 'app/styles'),
			'@components': path.resolve(__dirname, 'app/components'),
			'@pages': path.resolve(__dirname, 'app/pages'),
			'@router': path.resolve(__dirname, 'app/router'),
		},
	},
	server: {
		port: 5173
	}
})