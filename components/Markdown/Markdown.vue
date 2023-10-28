<script setup lang="ts">
import { onMounted } from "vue";
import { marked } from "marked";
import DOMPurify from "dompurify";
import markedLinkifyIt from "marked-linkify-it";
import katex from "katex";
import "katex/dist/katex.min.css";
import { emojify } from "node-emoji";
</script>

<script lang="ts">
export default {
    name: "Makdown",
    props: {
        md: {
            type: String,
            required: true,
        },
    },
    data() {
        const rendered = "";

        onMounted(() => {
            this.render();
        });

        return {
            rendered_html: rendered,
        };
    },

    methods: {
        render() {
            marked.use(markedLinkifyIt());
            const renderer = new marked.Renderer({
                headerIds: false,
            });
            renderer.text = (text: string) => {
                return text.replace(/\${2}([\s\S]*?)\${2}/g, (match, code) => {
                    try {
                        return (
                            // eslint-disable-next-line quotes
                            '<span class="katex-margin">' +
                            katex.renderToString(code, {
                                throwOnError: false,
                            }) +
                            "</span>"
                        );
                    } catch (err) {
                        return match;
                    }
                });
            };
            const mded = marked(this.md, {
                breaks: true,
                renderer: renderer,
            });
            this.rendered_html = DOMPurify.sanitize(emojify(mded), {
                // ? Maybe doing it later
                // ALLOWED_ATTR: [],
                // ALLOWED_TAGS: [],
                // ownly allow html
                USE_PROFILES: {
                    html: true,
                    svg: true,
                    mathMl: true,
                    svgFilters: false,
                },
            });
        },
    },
    watch: {
        md() {
            console.log(this.md);
            this.render();
        },
    },
};
</script>

<template>
    <div readonly class="markdown-rendered" :v-html="rendered_html" />
</template>

<style>
.markdown-rendered p i.v-icon {
    font-size: 15px;
}

.markdown-rendered {
    margin: 10px;
    padding: 10px;
    padding-left: 30px;
    box-sizing: border-box;
    width: calc(100% - (var(margin) + var(padding)) * 2);
    min-width: calc(100% - 20px);
    max-width: calc(100% - 20px);
    overflow-x: hidden;
}

.markdown-rendered img {
    max-height: 200px;
    min-height: 200px;
    width: auto;
    max-width: 80%;
}

code * {
    font-family: monospace !important;
}

p {
    align-items: center;
    font-size: 15px;
    position: relative;
}

h1,
h2,
h3,
h4,
h5,
h6 {
    margin-bottom: 8px;
}
</style>
