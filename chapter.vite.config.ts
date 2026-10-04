import {defineConfig} from 'vite';
export default defineConfig({root:'chapter',base:'/chapter/',build:{outDir:'../dist/chapter',emptyOutDir:true},server:{host:'127.0.0.1',port:4175,strictPort:true}});
