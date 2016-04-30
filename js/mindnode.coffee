$ ->
  $('.mindnode').each ->
    width = 560
    height = 420
    $(@).append "<p align=\"center\"><iframe width=\"#{width}\" height=\"#{height}\" src=\"https://my.mindnode.com/#{@id}\" frameborder=\"0\" allowfullscreen></iframe></p>"
