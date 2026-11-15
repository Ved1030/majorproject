#!/usr/bin/env python3
"""
LibreOffice UNO Server for Document Conversion
Runs as a persistent process that accepts conversion requests via JSON over stdin/stdout.
"""

import sys
import os
import json
import platform
import traceback
import tempfile
import shutil
from pathlib import Path

# Try to import UNO
try:
    import uno
    from com.sun.star.beans import PropertyValue
    from com.sun.star.connection import NoConnectException
    UNO_AVAILABLE = True
    UNO_IMPORT_ERROR = None
except Exception as exc:
    UNO_AVAILABLE = False
    UNO_IMPORT_ERROR = exc

try:
    import unohelper
    UNOHELPER_AVAILABLE = True
except Exception:
    UNOHELPER_AVAILABLE = False

# LibreOffice connection settings
LO_HOST = "localhost"
LO_PORT = 2002
LO_CONNECTION_STRING = f"socket,host={LO_HOST},port={LO_PORT},tcpNoDelay=1;urp;StarOffice.ComponentContext"

# Supported formats
SUPPORTED_INPUT_FORMATS = {
    'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt', 'rtf', 'odt', 'ods', 'odp',
    'txt', 'csv', 'html', 'htm'
}

# Output format mappings
EXPORT_FILTERS = {
    'pdf': {
        'filter_name': 'writer_pdf_Export',
        'filter_options': {}
    }
}

def check_environment():
    """Check if LibreOffice UNO bridge is available."""
    if not UNO_AVAILABLE:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": f"UNO bridge not available: {UNO_IMPORT_ERROR}",
        }
    
    # Try to connect to LibreOffice
    try:
        local_context = uno.getComponentContext()
        resolver = local_context.ServiceManager.createInstanceWithContext(
            "com.sun.star.bridge.UnoUrlResolver", local_context
        )
        ctx = resolver.resolve(f"uno:{LO_CONNECTION_STRING}")
        smgr = ctx.ServiceManager
        desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        
        # Get LibreOffice version
        try:
            config_provider = smgr.createInstanceWithContext(
                "com.sun.star.configuration.ConfigurationProvider", ctx
            )
            node = PropertyValue()
            node.Name = "nodepath"
            node.Value = "/org.openoffice.Setup/Product"
            ca = config_provider.createInstanceWithArguments(
                "com.sun.star.configuration.ConfigurationAccess", (node,)
            )
            version = ca.getByName("ooSetupVersion")
        except Exception:
            version = "unknown"
        
        return {
            "success": True,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "libreoffice_version": version,
            "uno_available": True,
        }
    except Exception as e:
        return {
            "success": False,
            "executable": sys.executable,
            "python_version": platform.python_version(),
            "error": f"Cannot connect to LibreOffice UNO server: {str(e)}",
            "uno_available": UNO_AVAILABLE,
        }

def convert_to_pdf(input_path, output_path):
    """Convert document to PDF using LibreOffice UNO API."""
    if not UNO_AVAILABLE:
        return {"success": False, "error": f"UNO bridge not available: {UNO_IMPORT_ERROR}"}
    
    try:
        # Connect to LibreOffice
        local_context = uno.getComponentContext()
        resolver = local_context.ServiceManager.createInstanceWithContext(
            "com.sun.star.bridge.UnoUrlResolver", local_context
        )
        ctx = resolver.resolve(f"uno:{LO_CONNECTION_STRING}")
        smgr = ctx.ServiceManager
        desktop = smgr.createInstanceWithContext("com.sun.star.frame.Desktop", ctx)
        
        # Convert file paths to file URLs
        input_url = uno.systemPathToFileUrl(os.path.abspath(input_path))
        output_url = uno.systemPathToFileUrl(os.path.abspath(output_path))
        
        # Load document
        load_props = (
            PropertyValue("Hidden", 0, True, 0),
            PropertyValue("ReadOnly", 0, True, 0),
        )
        
        doc = desktop.loadComponentFromURL(input_url, "_blank", 0, load_props)
        
        if not doc:
            return {"success": False, "error": "Failed to load document"}
        
        # Export to PDF
        filter_props = (
            PropertyValue("FilterName", 0, "writer_pdf_Export", 0),
            PropertyValue("Overwrite", 0, True, 0),
        )
        
        doc.storeToURL(output_url, filter_props)
        doc.close(True)
        
        # Verify output
        if os.path.exists(output_path) and os.path.getsize(output_path) > 0:
            return {"success": True, "output_path": output_path}
        else:
            return {"success": False, "error": "PDF output file not created"}
            
    except NoConnectException:
        return {"success": False, "error": "Cannot connect to LibreOffice server. Is it running?"}
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc()}

def process_request(request):
    """Process a single conversion request."""
    try:
        command = request.get("command")
        request_id = request.get("requestId")
        
        if command == "convert_to_pdf":
            input_path = request.get("input_path")
            output_path = request.get("output_path")
            
            if not input_path or not output_path:
                return {"success": False, "error": "Missing input_path or output_path", "requestId": request_id}
            
            if not os.path.exists(input_path):
                return {"success": False, "error": f"Input file not found: {input_path}", "requestId": request_id}
            
            result = convert_to_pdf(input_path, output_path)
            result["requestId"] = request_id
            return result
            
        elif command == "check":
            result = check_environment()
            result["requestId"] = request_id
            return result
            
        elif command == "shutdown":
            return {"status": "shutdown", "requestId": request_id}
            
        else:
            return {"success": False, "error": f"Unknown command: {command}", "requestId": request_id}
            
    except Exception as e:
        return {"success": False, "error": str(e), "traceback": traceback.format_exc(), "requestId": request.get("requestId")}

def main():
    """Main server loop."""
    if len(sys.argv) == 2 and sys.argv[1] == "--check":
        print(json.dumps(check_environment()))
        return
    
    print(json.dumps({"status": "ready", "pid": os.getpid()}), flush=True)
    
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        
        try:
            request = json.loads(line)
        except json.JSONDecodeError:
            print(json.dumps({"success": False, "error": "Invalid JSON", "requestId": None}), flush=True)
            continue
        
        # Handle shutdown command
        if request.get("command") == "shutdown":
            print(json.dumps({"status": "shutdown", "requestId": request.get("requestId")}), flush=True)
            break
        
        result = process_request(request)
        print(json.dumps(result), flush=True)

if __name__ == "__main__":
    main()