// export function createSelectionFromPoint(startX: number, startY: number, endX: number, endY: number) {
//   var doc = document;
//   var start, end, range = null;
//   if (typeof doc.caretPositionFromPoint != "undefined") {
//     start = doc.caretPositionFromPoint(startX, startY);
//     end = doc.caretPositionFromPoint(endX, endY);
//     range = doc.createRange();
//     range.setStart(start.offsetNode, start.offset);
//     range.setEnd(end.offsetNode, end.offset);
//   } else if (typeof doc.caretRangeFromPoint != "undefined") {
//     start = doc.caretRangeFromPoint(startX, startY);
//     end = doc.caretRangeFromPoint(endX, endY);
//     range = doc.createRange();
//     range.setStart(start.startContainer, start.startOffset);
//     range.setEnd(end.startContainer, end.startOffset);
//   }
//   if (range !== null && typeof window.getSelection != "undefined") {
//     var sel = window.getSelection();
//     sel.removeAllRanges();
//     sel.addRange(range);
//   } else if (typeof doc.body.createTextRange != "undefined") {
//     range = doc.body.createTextRange();
//     range.moveToPoint(startX, startY);
//     var endRange = range.duplicate();
//     endRange.moveToPoint(endX, endY);
//     range.setEndPoint("EndToEnd", endRange);
//     range.select();
//   }
// }

import { Report } from "../../report";

function createRangeOrCaretFromPoint(doc: Document, startX: number, startY: number) {
  if (typeof doc.caretPositionFromPoint != "undefined") {
    return doc.caretPositionFromPoint(startX, startY);
  } else if (typeof doc.caretRangeFromPoint != "undefined") {
    return doc.caretRangeFromPoint(startX, startY);
  }
}

type ViewPort = { left: number, right: number, top: number, bottom: number }

export const getFirstVisibleNodeForViewport = (documentOrElement: Document | Element, viewport: ViewPort) => {
  const element = (`body` in documentOrElement)
    ? getFirstVisibleElementForViewport(documentOrElement.body, viewport)
    : getFirstVisibleElementForViewport(documentOrElement, viewport)

  const ownerDocument = `createRange` in documentOrElement ? documentOrElement : documentOrElement.ownerDocument

  if (element) {
    let lastValidRange: Range | undefined
    let lastValidOffset = 0
    const range = ownerDocument.createRange()

    Array.from(element.childNodes).some(childNode => {
      range.selectNodeContents(childNode)
      const rects = range.getClientRects()
      const visibleRect = getFirstVisibleDOMRect(rects, viewport)

      // At this point we know the range is valid and contains visible rect.
      // This means we have a valid Node. We still need to know the visible offset to be 100% accurate 
      if (visibleRect) {
        lastValidRange = range.cloneRange()

        // now we will try to refine the search to get the offset
        // this is an incredibly expensive operation so we will try to 
        // use native functions to get something 
        const rangeOrCaret = createRangeOrCaretFromPoint(ownerDocument, visibleRect.left, visibleRect.top)
        // good news we found something with same node so we can assume the offset is already better than nothing
        if (rangeOrCaret && `startContainer` in rangeOrCaret && rangeOrCaret.startContainer === lastValidRange.startContainer) {
          lastValidOffset = rangeOrCaret.startOffset
        }
        if (rangeOrCaret && `offsetNode` in rangeOrCaret && rangeOrCaret.offsetNode === lastValidRange.startContainer) {
          lastValidOffset = rangeOrCaret.offset
        }
        return true
      }
      return false
    })

    if (lastValidRange) {
      return { node: lastValidRange.startContainer, offset: lastValidOffset }
    }

    return { node: element, offset: 0 }
  }

  return undefined
}

const getFirstVisibleElementForViewport = (element: Element, viewport: ViewPort) => {
  let lastValidElement: Element | undefined = undefined
  const positionFromViewport = getElementOrNodePositionFromViewPort(element.getBoundingClientRect(), viewport)

  if (positionFromViewport !== 'before' && positionFromViewport !== 'after') {
    lastValidElement = element
  }

  Array.from(element.children).some(child => {
    const childInViewPort = getFirstVisibleElementForViewport(child, viewport)
    if (childInViewPort) {
      lastValidElement = childInViewPort

      return true
    }

    return false
  })

  return lastValidElement
}

function getElementOrNodePositionFromViewPort(domRect: DOMRect, { left, right }: ViewPort) {
  // horizontal + ltr
  if (domRect.left <= left && domRect.right <= left) return 'before';
  if (domRect.left <= left && domRect.right > left && domRect.right <= right) return 'partially-before';
  if (domRect.left <= right && domRect.right > right) return 'partially-after';
  if (domRect.left > right) return 'after';
  return 'within';

  // @todo rtl
  // @todo vertical-lrt
  // @todo vertical-rtl
}

function getFirstVisibleDOMRect(domRect: DOMRectList, viewport: ViewPort) {
  return Array.from(domRect).find(domRect => {
    const position = getElementOrNodePositionFromViewPort(domRect, viewport)

    if (position !== 'before' && position !== 'after') {
      return true
    }
    return false
  })
}

export const getRangeFromNode = (node: Node, offset: number) => {
  if (node.nodeType !== Node.CDATA_SECTION_NODE && node.nodeType !== Node.DOCUMENT_TYPE_NODE) {
    const range = node.ownerDocument?.createRange()
    range?.selectNodeContents(node)
    try {
      range?.setStart(node, offset || 0)
    } catch (e) {
      Report.error(e)
    }

    return range
  }

  return undefined
}