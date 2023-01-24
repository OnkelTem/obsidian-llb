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

Feel free to open an issue if you want another language to be added. We can discuss it.

### Turkish

Even if you're not interested in Turkish specifically, you can still read the next section to get some idea of the approach.

[Turkish support](docs/Turkish.md)

## TODO

- [ ] Add more languages:
  - [ ] Russian
  - [ ] French
  - [ ] English
  - [ ] Arabic
- [ ] Create a video about using this repo
- [ ] Find a way to annotate texts.
