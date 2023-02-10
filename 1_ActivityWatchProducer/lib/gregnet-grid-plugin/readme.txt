GREGNET GRID PLUGIN - HOW TO USE
--------------------------------

0) put this folder into your lib directory


1) Copy this line into your header:
<!--
//THIS ELEMENT CONTAINS ALL THE GRID
.content-wrapper 
	___________
	.row #row_1
		.row-topbar
			.row-title
			.row-button
		.cols-wrapper
			.col-2 <----content
			.col-2 <----content
	___________
	.row #row_2
		.rowtopbar
			...
		.cols-wrapper
			...  <----content
-->
<link rel="stylesheet" type="text/css" href="lib/gregnet-grid-plugin/gregnet-grid-style.css">


2) Copy this line at the end of your body before your main script:
<script type="text/javascript" src="lib/gregnet-grid-plugin/gregnet-grid-script.js"></script>


3) This is an example: