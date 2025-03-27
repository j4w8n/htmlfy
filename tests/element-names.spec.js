import { isHtml } from '../src/utils.js'
import { expect, test } from 'vitest'

test('Is valid custom element', () => {
  expect(isHtml('<custom-element></custom-element>')).toBe(true)
})

test('Custom element names cannot begin with a hyphen', () => {
  expect(isHtml('<-custom-element></-custom-element>')).toBe(false)
})

test('Custom element names cannot begin with a period', () => {
  expect(isHtml('<.custom-element></.custom-element>')).toBe(false)
})

test('Custom element names cannot begin with an underscore', () => {
  expect(isHtml('<_custom-element></_custom-element>')).toBe(false)
})

test('Custom element names must have all lowercase letters', () => {
  expect(isHtml('<Custom-element></custom-element>')).toBe(false)
})

test('Custom element names can end with a number', () => {
  expect(isHtml('<custom-element0></custom-element0>')).toBe(true)
})

test('Custom element names can end with a hyphen', () => {
  expect(isHtml('<custom-element-></custom-element->')).toBe(true)
})

test('Custom element names can end with a period', () => {
  expect(isHtml('<custom-element.></custom-element.>')).toBe(true)
})

test('Custom element names can end with an underscore', () => {
  expect(isHtml('<custom-element_></custom-element_>')).toBe(true)
})

test('Custom element names can have crazy names', () => {
  expect(isHtml('<cus---t0m...element___></cus---t0m...element___>')).toBe(true)
})
