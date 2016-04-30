$ ->
  $('.youtube').each ->
    width = 560
    height = 420
    $(@).append "<p align=\"center\"><iframe width=\"#{width}\" height=\"#{height}\" src=\"http://www.youtube.com/embed/#{@id}\" frameborder=\"0\" allowfullscreen></iframe></p>"
