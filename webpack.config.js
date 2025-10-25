const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
//const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {

    // 1. entry: 기존 파일 경로에 맞게 설정
    entry: {
        background: './src/js/background.js',
        content: './src/js/content.js', 
        popup: './src/js/popup.js',
    },

    // 2. output: 파일 이름의 문법 오류 수정
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },

    // 3. module: CSS 및 에셋(이미지 등)을 처리하기 위한 로더 추가
    module: {
        rules: [
         
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'],
            },
          
            {
                test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },

    optimization: {

        runtimeChunk: false
      },
      
    externals: {
        chrome: 'chrome'
    },

    // 4. plugins: manifest.json과 popup.html을 dist 폴더로 복사
    plugins: [
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: 'static/manifest.json',
                    to: 'manifest.json'         
                },
                { from: 'src/assets' },
                {
                    from: 'src/css/masking.css', 
                    to: 'masking.css'         
                },
                {
                    from: 'src/css/earlyImgMasking.css', 
                    to: 'earlyImgMasking.css' 
                },
                {
                    from: 'src/popup.html',
                    to: 'popup.html'       
                },

            ],
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css', 
          })
    ],
};

