$ ->
  $('.mindnode').each ->
    width = 400
    height = 400
    $(@).append "<p align=\"center\"><iframe src=\"https://my.mindnode.com/#{@id}/em#176,-912,-4\" frameborder=\"0\" marginheight=\"0\" marginwidth=\"0\" style=\"border: 1px solid rgb(204, 204, 204); width: #{width}px; height: #{height}px;\" onmousewheel=\"\"></iframe></p>"


