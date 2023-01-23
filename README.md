# Obsidian Language Learning Board

This repository provides:

- An [Obsidian](https://obsidian.md/) _vault_ (LLB-vault), that is targeted at learning languages.
- A maintenance script `obsidian-llb`, that can create new LLB-vaults and update existing ones.

## Vault

It doesn't have any learning materials on its own, rather - it's a container for them.

In many ways, it's a vocabulary, where each entry - is an Obsidian note.

The main use case of using this vault is importing texts and then researching them, filling in your hypertext vocabulary.

The key feature of this vault is a javascript file that uses the Obsidian [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin and provides a simple way to build and visualize virtual links on a virtual "card":

![image](https://user-images.githubusercontent.com/114060/211510685-d03d1251-434d-479c-bb1f-a919840d404b.png)

### Usage

- Download `vault-dist.zip` from the Releases page.
- Unpack wherever you want.
- Open it with Obsidian.

### Vault contents

The vault contains:

- `_llb-<lang>_` directory, with templates, special javascript, and vocabulary
- A hew Obsidian plugins:
  - [Dataview](https://github.com/blacksmithgu/obsidian-dataview) - provides database-like access to a vault and is used as a library for the javascript contained in this vault.
  - [Quickadd](https://github.com/chhoumann/quickadd) - provides a few handy shortcuts for creating vocabulary entries.
  - [Templater](https://github.com/SilentVoid13/Templater) - provides `<%...%>`-templates for notes. Used in the vocabulary templates;
- an Obsidian configuration that is almost the same as the default one.

## `obsidian-llb` maintenance script

### Install

```
$ npm i -g obsidian-llb
```

### Usage

To create a new Turkish llb-vault:

```
$ obsidian-llb create tr path/to/vault
```

To update an existing Turkish llb-vault:

```
$ obsidian-llb update tr path/to/vault
```

## Supported languages

Currently, only Turkish is supported.

If you're not interested in Turkish specifically, you can still read the next section to get some idea of the approach.

Feel free to open an issue if you want another language to be added. We can discuss it.

### Turkish LLB

One of the distinctive characteristics of the Turkish language is extensive [agglutination](https://www.turkishtextbook.com/adding-word-endings-agglutination/).
This means that words are compound words, they're made up of a root (stem) and multiple endings.

So learning Turkish is very much about learning those compound words and the ways they're built.

Each such word or phrase may have a story, a definition, a set of examples, and forward and backward links. And it's also an entry in the vocabulary you're creating.

There are two types of vocabulary entries: `suffix` and `word`.

So you will be adding texts in Turkish, and linking phrases, words, and suffixes of your interest to special `word` and `suffix` notes, building up your personal "investigation board", and in fact - a hypertext vocabulary.

![image](https://user-images.githubusercontent.com/114060/211514176-245e9273-b568-4e94-9ba3-c2c9ae73a794.png)

## TODO

- [ ] Add more languages:
  - [ ] Russian
  - [ ] French
  - [ ] English
  - [ ] Arabic
- [ ] Create a video on using this repo
