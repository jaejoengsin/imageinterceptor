const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
//const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
    // 모드 설정은 webpack.dev.js와 webpack.prod.js에서 정의

    // 1. entry: 기존 파일 경로에 맞게 설정
    entry: {
        background: './src/js/background.js',
        content: './src/js/content.js', // content-script.js를 content.js로 변경하는 것을 권장
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
            // CSS 파일을 처리하는 규칙
            {
                test: /\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'],
            },
            // 이미지, 폰트 등 에
            // 셋 파일을 처리하는 규칙
            {
                test: /\.(png|svg|jpg|jpeg|gif|woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
            },
        ],
    },

    optimization: {
        // splitChunks 설정 제거
        // splitChunks: {
        //    chunks: 'all',
        //    name: false,
        // },
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
                    from: 'static/manifest.json', // static 폴더 내 manifest.json의 원본 경로
                    to: 'manifest.json'          // dist 폴더의 최상위 경로로 복사
                },
                { from: 'src/assets' },
                {
                    from: 'src/css/masking.css', // static 폴더 내 manifest.json의 원본 경로
                    to: 'masking.css'          // dist 폴더의 최상위 경로로 복사
                },
                {
                    from: 'src/css/earlyImgMasking.css', 
                    to: 'earlyImgMasking.css' 
                },
                {
                    from: 'src/popup.html', // static 폴더 내 manifest.json의 원본 경로
                    to: 'popup.html'          // dist 폴더의 최상위 경로로 복사
                },

            ],
        }),
        new MiniCssExtractPlugin({
            filename: '[name].css', // content.css, popup.css 등으로 자동 생성
          })
    ],
};

